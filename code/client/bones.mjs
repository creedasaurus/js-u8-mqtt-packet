import {_mqtt_client_conn} from './_conn.mjs'
export * from './_conn.mjs'

export class MQTTBonesClient {
  constructor(on_mqtt) {
    this._conn_ = _mqtt_client_conn(this)
    if (on_mqtt) {
      this.on_mqtt = on_mqtt
      this.on_mqtt([], {mqtt:this})
    }
  }

  auth(pkt) { return this._send('auth', pkt) }
  connect(pkt) { return this._send('connect', pkt) }
  disconnect(pkt) { return this._send('disconnect', pkt) }

  ping() { return this._send('pingreq') }

  subscribe(pkt) { return this._send('subscribe', pkt) }
  unsubscribe(pkt) { return this._send('unsubscribe', pkt) }

  puback(pkt) { return this._send('puback', pkt) }
  publish(pkt) { return this._send('publish', pkt) }

  // _send(type, pkt) -- provided by _conn_ and transport
  on_mqtt(/*pkt_list, ctx*/) {}

  static with(mqtt_session) {
    this.prototype.mqtt_session = mqtt_session
    return this
  }
}
