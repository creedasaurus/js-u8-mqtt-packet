const { u8_to_hex } = require("u8-utils");
const { createWriteStream } = require("fs");
const { pipeline } = require("stream");
const { createServer, connect } = require("net");
const {
  mqtt_opts_v5,
  mqtt_pkt_ctx,
  mqtt_raw_dispatch,
} = require("u8-mqtt-packet");
const mqtt_ctx_v5 = mqtt_pkt_ctx("?", mqtt_opts_v5);
//const mqtt_pkt = require('mqtt-packet')

const argv_opt = process.argv.slice(2);
const tgt_port = parseInt(argv_opt.shift() || 1883);
const mitm_port = parseInt(argv_opt.shift() || 1884);

const mqtt_raw_packets = () =>
  mqtt_raw_dispatch({
    decode_pkt: (b0, u8_body) => ({ b0, u8_body }),
  });

createServer()
  .on("error", (err) => console.warn("Error on server:", err))
  .on("listening", () => console.log("Ready"))
  .on("connection", _on_connect_mitm)
  .listen(mitm_port);

function _on_connect_mitm(sock_src) {
  const ts_log = createWriteStream(
    `logs/mqtt.${Date.now().toString(36)}.log.json`,
  );

  ts_log.write(`{"info":${JSON.stringify({ mitm_port })}, "mqtt_log":[\n`);

  const sock_dst = connect(tgt_port, "127.0.0.1", () => {
    console.log("MQTT mitm connection", `${mitm_port} to ${tgt_port}`);

    pipeline(
      sock_src,
      _mitm_log(ts_log, "c2s", "==>"),
      sock_dst,
      _mitm_log(ts_log, "s2c", "<=="),
      sock_src,

      async (err) => {
        ts_log.write(`  null ]}\n`);
        ts_log.end();

        sock_dst.end();
        sock_src.end();

        if (err) console.warn("Error at end of pipeline:", err);
      },
    );
  });
}

let wm_ts_log = new WeakMap();
function _mitm_log(ts_log, tag, arrows) {
  return async function* (stream) {
    const mqtt_decode_raw = mqtt_raw_packets();
    const mqtt_ctx = mqtt_ctx_v5.session();
    const mqtt_decode = mqtt_ctx.mqtt_stream();

    wm_ts_log.set(ts_log, mqtt_ctx);

    for await (let chunk of stream) {
      chunk = new Uint8Array(chunk); // force Buffer to a Uint8Array

      try {
        for (const { u8_raw } of mqtt_decode_raw(chunk)) {
          for (const pkt of mqtt_decode(u8_raw)) {
            let row = JSON.stringify([tag, pkt.type, u8_to_hex(u8_raw)]);
            if (1) row = `${row.slice(0, -1)},\n      ${JSON.stringify(pkt)} ]`;
            ts_log.write(`  ${row},\n`);

            if (1) console.log(arrows, pkt.type, pkt);
            else rt_pkt(pkt, u8_raw);

            yield u8_raw;
          }
        }
      } catch (err) {
        console.error("mitm err:", err);
      }
    }
    if (1) console.log(arrows, "###### done");

    function rt_pkt(pkt, u8_raw) {
      try {
        let rt_pkt = mqtt_ctx.encode_pkt(pkt.type, pkt);
        if (undefined === rt_pkt) {
          console.log("No RT", pkt.type, pkt);
          return;
        }

        let eq =
          u8_raw.byteLength === rt_pkt.byteLength &&
          0 === rt_pkt.compare(u8_raw);

        console.group(arrows, pkt.type, [
          "orig",
          u8_raw.byteLength,
          "rt",
          rt_pkt.byteLength,
          "eq",
          eq,
        ]);
        if (!eq) {
          console.log("pkt", pkt);
          console.log(" original", u8_to_hex(u8_raw));
          console.log("roundtrip", u8_to_hex(rt_pkt));

          if ("undefined" !== typeof mqtt_pkt)
            mqtt_pkt
              .parser()
              .on("packet", (pkt_o) => console.log("3p", pkt_o))
              .parse(u8_raw);
        }
        console.groupEnd();
      } catch (err) {
        console.error("rt_pkt err:", err);
      }
    }
  };
}
