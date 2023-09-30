export function mqtt_decode_disconnect(ns, mqtt_reader) {
  return (ns[0xe] = (pkt, u8_body) => {
    if (u8_body && 5 <= pkt.mqtt_level) {
      let rdr = mqtt_reader.of(u8_body);
      pkt.reason = rdr.reason(pkt.type);
      pkt.props = rdr.props();
    }
    return pkt;
  });
}

export function _disconnect_v5(mqtt_reader) {
  mqtt_reader.reasons(
    "disconnect",
    // MQTT 5.0
    [0x00, "Normal disconnection"],
    [0x04, "Disconnect with Will Message"],
    [0x80, "Unspecified error"],
    [0x81, "Malformed Packet"],
    [0x82, "Protocol Error"],
    [0x83, "Implementation specific error"],
    [0x87, "Not authorized"],
    [0x89, "Server busy"],
    [0x8b, "Server shutting down"],
    [0x8d, "Keep Alive timeout"],
    [0x8e, "Session taken over"],
    [0x8f, "Topic Filter invalid"],
    [0x90, "Topic Name invalid"],
    [0x93, "Receive Maximum exceeded"],
    [0x94, "Topic Alias invalid"],
    [0x95, "Packet too large"],
    [0x96, "Message rate too high"],
    [0x97, "Quota exceeded"],
    [0x98, "Administrative action"],
    [0x99, "Payload format invalid"],
    [0x9a, "Retain not supported"],
    [0x9b, "QoS not supported"],
    [0x9c, "Use another server"],
    [0x9d, "Server moved"],
    [0x9e, "Shared Subscriptions not supported"],
    [0x9f, "Connection rate exceeded"],
    [0xa0, "Maximum connect time"],
    [0xa1, "Subscription Identifiers not supported"],
    [0xa2, "Wildcard Subscriptions not supported"],
  );
}
