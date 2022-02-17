var e = require("eventemitter3").EventEmitter;

function t(e, t, n, r, i, o, a) {
	try {
		var s = e[o](a),
			c = s.value
	} catch (e) {
		return void n(e)
	}
	s.done ? t(c) : Promise.resolve(c).then(r, i)
}

function n(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
	}
}
var r = function () {
	function e(t, n, r) {
		var i = this;
		! function (e, t) {
			if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
		}(this, e), this.network = t, this.connections = n, this.ws = new WebSocket(r), this.ws.addEventListener("open", (function () {
			i.network.emit("ready")
		})), this.ws.addEventListener("error", (function (e) {
			i.network.emit("signalingerror", e), 0 === i.network.listenerCount("signalingerror") && console.error("signallingerror not handled:", e)
		})), this.ws.addEventListener("close", (function () {})), this.ws.addEventListener("message", (function (e) {
			i.handleSignalingMessage(e.data).catch((function (e) {}))
		}))
	}
	var r, i, o, a, s;
	return r = e, (i = [{
		key: "close",
		value: function (e) {
			null != this.receivedID && this.send({
				type: "leave",
				id: this.receivedID,
				reason: null != e ? e : "normal closure"
			}), this.ws.close()
		}
	}, {
		key: "send",
		value: function (e) {
			if (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN) {
				this.network.log("sending signaling packet:", e.type);
				var t = JSON.stringify(e);
				this.ws.send(t)
			}
		}
	}, {
		key: "handleSignalingMessage",
		value: (a = regeneratorRuntime.mark((function e(t) {
			var n, r, i;
			return regeneratorRuntime.wrap((function (e) {
				for (;;) switch (e.prev = e.next) {
					case 0:
						e.prev = 0, n = JSON.parse(t), this.network.log("signaling packet received:", n.type), e.t0 = n.type, e.next = "joined" === e.t0 ? 6 : "connect" === e.t0 ? 13 : "disconnected" === e.t0 ? 17 : "candidate" === e.t0 || "description" === e.t0 ? 19 : 26;
						break;
					case 6:
						if ("" !== n.id) {
							e.next = 8;
							break
						}
						throw new Error("missing id on received connect packet");
					case 8:
						if ("" !== n.lobby) {
							e.next = 10;
							break
						}
						throw new Error("missing lobby on received connect packet");
					case 10:
						return this.receivedID = n.id, this.network.emit("lobby", n.lobby), e.abrupt("break", 26);
					case 13:
						if (this.receivedID !== n.id) {
							e.next = 15;
							break
						}
						return e.abrupt("return");
					case 15:
						return this.network._addPeer(n.id, n.polite), e.abrupt("break", 26);
					case 17:
						return this.connections.has(n.id) && (null === (r = this.connections.get(n.id)) || void 0 === r || r.close()), e.abrupt("break", 26);
					case 19:
						if (!this.connections.has(n.source)) {
							e.next = 24;
							break
						}
						return e.next = 22, null === (i = this.connections.get(n.source)) || void 0 === i ? void 0 : i._onSignalingMessage(n);
					case 22:
						e.next = 25;
						break;
					case 24:
						this.network.closing || console.error(this.network.id, "recieved packet for unknown connection (id):", n.source);
					case 25:
						return e.abrupt("break", 26);
					case 26:
						e.next = 31;
						break;
					case 28:
						e.prev = 28, e.t1 = e.catch(0), this.network.emit("signalingerror", e.t1);
					case 31:
					case "end":
						return e.stop()
				}
			}), e, this, [
				[0, 28]
			])
		})), s = function () {
			var e = this,
				n = arguments;
			return new Promise((function (r, i) {
				var o = a.apply(e, n);

				function s(e) {
					t(o, r, i, s, c, "next", e)
				}

				function c(e) {
					t(o, r, i, s, c, "throw", e)
				}
				s(void 0)
			}))
		}, function (e) {
			return s.apply(this, arguments)
		})
	}]) && n(r.prototype, i), o && n(r, o), e
}();

function i(e) {
	return function (e) {
		if (Array.isArray(e)) return o(e)
	}(e) || function (e) {
		if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e)
	}(e) || function (e, t) {
		if (!e) return;
		if ("string" == typeof e) return o(e, t);
		var n = Object.prototype.toString.call(e).slice(8, -1);
		"Object" === n && e.constructor && (n = e.constructor.name);
		if ("Map" === n || "Set" === n) return Array.from(e);
		if ("Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return o(e, t)
	}(e) || function () {
		throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
	}()
}

function o(e, t) {
	(null == t || t > e.length) && (t = e.length);
	for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
	return r
}

function a(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
	}
}

function s(e, t, n) {
	return t in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e
}
var c = function () {
	function e(t, n) {
		var r = this;
		! function (e, t) {
			if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
		}(this, e), s(this, "window", []), s(this, "lastPingSentAt", 0), s(this, "last", 0), s(this, "average", 0), s(this, "jitter", 0), s(this, "max", 0), s(this, "min", 0), this.peer = t, this.control = n, void 0 !== n && (this.ping(), n.addEventListener("message", (function (e) {
			return r.onMessage(e.data)
		})))
	}
	var t, n, r;
	return t = e, (n = [{
		key: "ping",
		value: function () {
			var e, t;
			this.lastPingSentAt = performance.now(), "open" === (null === (e = this.control) || void 0 === e ? void 0 : e.readyState) && (null === (t = this.control) || void 0 === t || t.send("ping"))
		}
	}, {
		key: "onMessage",
		value: function (e) {
			var t, n, r = this;
			if ("ping" !== e) {
				if ("pong" === e) {
					var o = performance.now() - this.lastPingSentAt;
					this.window.unshift(o), this.window.length > 50 && this.window.pop(), this.last = o, this.max = Math.max.apply(Math, i(this.window)), this.min = Math.min.apply(Math, i(this.window)), this.average = this.window.reduce((function (e, t) {
						return e + t
					}), 0) / this.window.length, this.window.length > 1 && (this.jitter = this.window.slice(1).map((function (e, t) {
						return Math.abs(e - r.window[t])
					})).reduce((function (e, t) {
						return e + t
					}), 0) / (this.window.length - 1)), setTimeout((function () {
						return r.ping()
					}), 500 - o)
				}
			} else "open" === (null === (t = this.control) || void 0 === t ? void 0 : t.readyState) && (null === (n = this.control) || void 0 === n || n.send("pong"))
		}
	}]) && a(t.prototype, n), r && a(t, r), e
}();

function u(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter((function (t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable
		}))), n.push.apply(n, r)
	}
	return n
}

function l(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = null != arguments[t] ? arguments[t] : {};
		t % 2 ? u(Object(n), !0).forEach((function (t) {
			p(e, t, n[t])
		})) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : u(Object(n)).forEach((function (t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t))
		}))
	}
	return e
}

function h(e, t, n, r, i, o, a) {
	try {
		var s = e[o](a),
			c = s.value
	} catch (e) {
		return void n(e)
	}
	s.done ? t(c) : Promise.resolve(c).then(r, i)
}

function f(e) {
	return function () {
		var t = this,
			n = arguments;
		return new Promise((function (r, i) {
			var o = e.apply(t, n);

			function a(e) {
				h(o, r, i, a, s, "next", e)
			}

			function s(e) {
				h(o, r, i, a, s, "throw", e)
			}
			a(void 0)
		}))
	}
}

function d(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
	}
}

function p(e, t, n) {
	return t in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e
}
var g = function () {
	function e(t, n, r, i, o) {
		var a = this;
		! function (e, t) {
			if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
		}(this, e), p(this, "makingOffer", !1), p(this, "ignoreOffer", !1), p(this, "isSettingRemoteAnswerPending", !1), p(this, "opened", !1), p(this, "closing", !1), p(this, "reconnecting", !1), p(this, "allowNextManualRestartIceAt", 0), p(this, "latency", new c(this)), p(this, "lastMessageReceivedAt", 0), this.network = t, this.signaling = n, this.id = r, this.config = i, this.polite = o, this.channels = {}, this.network.log("creating peer"), this.testSessionWrapper = void 0, this.conn = new RTCPeerConnection(i), void 0 === i.testproxyURL ? this.conn.addEventListener("icecandidate", (function (e) {
			var t = e.candidate;
			null !== t && n.send({
				type: "candidate",
				source: a.network.id,
				recipient: a.id,
				candidate: t
			})
		})) : this.testSessionWrapper = v, this.conn.addEventListener("negotiationneeded", (function () {
			a.politenessTimeout = setTimeout((function () {
				f(regeneratorRuntime.mark((function e() {
					var t, n;
					return regeneratorRuntime.wrap((function (e) {
						for (;;) switch (e.prev = e.next) {
							case 0:
								if (e.prev = 0, !a.closing) {
									e.next = 3;
									break
								}
								return e.abrupt("return");
							case 3:
								a.makingOffer = !0, e.next = 13;
								break;
							case 8:
								return e.t1 = e.sent, e.next = 11, e.t0.setLocalDescription.call(e.t0, e.t1);
							case 11:
								e.next = 15;
								break;
							case 13:
								return e.next = 15, a.conn.setLocalDescription();
							case 15:
								if (null == (t = a.conn.localDescription)) {
									e.next = 20;
									break
								}
								return e.next = 19, null === (n = a.testSessionWrapper) || void 0 === n ? void 0 : n.call(a, t, a.config, a.network.id, a.id);
							case 19:
								a.signaling.send({
									type: "description",
									source: a.network.id,
									recipient: a.id,
									description: t
								});
							case 20:
								e.next = 26;
								break;
							case 22:
								e.prev = 22, e.t2 = e.catch(0), a.network.emit("signalingerror", e.t2), 0 === a.network.listenerCount("signalingerror") && console.error("signallingerror not handled:", e.t2);
							case 26:
								return e.prev = 26, a.makingOffer = !1, e.finish(26);
							case 29:
							case "end":
								return e.stop()
						}
					}), e, null, [
						[0, 22, 26, 29]
					])
				})))().catch((function (e) {}))
			}), a.polite ? 100 : 0)
		})), this.checkStateInterval = setInterval((function () {
			a.checkState()
		}), 500), this.conn.addEventListener("signalingstatechange", (function () {
			return a.checkState()
		})), this.conn.addEventListener("connectionstatechange", (function () {
			return a.checkState()
		})), this.conn.addEventListener("iceconnectionstatechange", (function () {
			return a.checkState()
		})), this.network.emit("connecting", this);
		var s = 0,
			u = function (e) {
				var t = a.conn.createDataChannel(e, l(l({}, a.network.dataChannels[e]), {}, {
					id: s++,
					negotiated: !0
				}));
				t.addEventListener("error", (function (e) {
					return a.onError(e)
				})), t.addEventListener("closing", (function () {
					return a.checkState()
				})), t.addEventListener("close", (function () {
					return a.checkState()
				})), t.addEventListener("open", (function () {
					a.opened || Object.values(a.channels).some((function (e) {
						return "open" !== e.readyState
					})) || ("control" in a.channels && (a.latency = new c(a, a.channels.control)), void 0 !== a.politenessTimeout && clearTimeout(a.politenessTimeout), a.signaling.send({
						type: "connected",
						id: a.id
					}), a.opened = !0, a.network.emit("connected", a))
				})), t.addEventListener("message", (function (t) {
					a.lastMessageReceivedAt = performance.now(), "control" !== e && a.network.emit("message", a, e, t.data)
				})), a.channels[e] = t
			};
		for (var h in this.network.dataChannels) u(h)
	}
	var t, n, r, i;
	return t = e, (n = [{
		key: "close",
		value: function (e) {
			this.closing || (this.closing = !0, this.signaling.send({
				type: "disconnected",
				id: this.id,
				reason: null != e ? e : "normal closure"
			}), Object.values(this.channels).forEach((function (e) {
				return e.close()
			})), this.conn.close(), this.network._removePeer(this), null != this.checkStateInterval && clearInterval(this.checkStateInterval), this.opened && this.network.emit("disconnected", this))
		}
	}, {
		key: "checkState",
		value: function () {
			var e, t = null !== (e = this.conn.connectionState) && void 0 !== e ? e : this.conn.iceConnectionState;
			if (!this.closing)
				if (this.opened) {
					if (Object.values(this.channels).some((function (e) {
							return "open" !== e.readyState
						})) && this.close("data channel closed"), this.reconnecting || "disconnected" !== t && "failed" !== t ? this.reconnecting && "connected" === t && (this.reconnecting = !1, this.network.emit("reconnected", this)) : (this.reconnecting = !0, this.conn.restartIce(), this.network.emit("reconnecting", this)), !this.reconnecting && "control" in this.channels) {
						var n = this.lastMessageReceivedAt;
						if (0 !== n) {
							var r = performance.now();
							r - n > 1e3 && r > this.allowNextManualRestartIceAt && (this.allowNextManualRestartIceAt = r + 1e4, this.conn.restartIce())
						}
					}
				} else "failed" === t && this.close("connecting failed")
		}
	}, {
		key: "onError",
		value: function (e) {
			this.network.emit("rtcerror", e), 0 === this.network.listenerCount("rtcerror") && console.error("rtcerror not handled:", e), this.checkState()
		}
	}, {
		key: "_onSignalingMessage",
		value: (i = f(regeneratorRuntime.mark((function e(t) {
			var n, r, i, o, a;
			return regeneratorRuntime.wrap((function (e) {
				for (;;) switch (e.prev = e.next) {
					case 0:
						e.t0 = t.type, e.next = "candidate" === e.t0 ? 3 : "description" === e.t0 ? 14 : 42;
						break;
					case 3:
						if (null == t.candidate) {
							e.next = 13;
							break
						}
						return e.prev = 4, e.next = 7, this.conn.addIceCandidate(t.candidate);
					case 7:
						e.next = 13;
						break;
					case 9:
						if (e.prev = 9, e.t1 = e.catch(4), this.ignoreOffer) {
							e.next = 13;
							break
						}
						throw e.t1;
					case 13:
						return e.abrupt("break", 42);
					case 14:
						if (n = t.description, r = !this.makingOffer && ("stable" === this.conn.signalingState || this.isSettingRemoteAnswerPending), i = "offer" === n.type && !r, this.ignoreOffer = !this.polite && i, !this.ignoreOffer) {
							e.next = 20;
							break
						}
						return e.abrupt("return");
					case 20:
						return this.isSettingRemoteAnswerPending = "answer" === n.type, e.next = 23, this.conn.setRemoteDescription(n);
					case 23:
						if (this.isSettingRemoteAnswerPending = !1, "offer" !== n.type) {
							e.next = 41;
							break
						}
						e.next = 34;
						break;
					case 29:
						return e.t3 = e.sent, e.next = 32, e.t2.setLocalDescription.call(e.t2, e.t3);
					case 32:
						e.next = 36;
						break;
					case 34:
						return e.next = 36, this.conn.setLocalDescription();
					case 36:
						if (null == (o = this.conn.localDescription)) {
							e.next = 41;
							break
						}
						return e.next = 40, null === (a = this.testSessionWrapper) || void 0 === a ? void 0 : a.call(this, o, this.config, this.network.id, this.id);
					case 40:
						this.signaling.send({
							type: "description",
							source: this.network.id,
							recipient: this.id,
							description: o
						});
					case 41:
						return e.abrupt("break", 42);
					case 42:
					case "end":
						return e.stop()
				}
			}), e, this, [
				[4, 9]
			])
		}))), function (e) {
			return i.apply(this, arguments)
		})
	}, {
		key: "send",
		value: function (e, t) {
			if (!(e in this.channels)) throw new Error("unknown channel " + e);
			var n = this.channels[e];
			"open" === n.readyState && n.send(t)
		}
	}, {
		key: "toString",
		value: function () {
			return "[Peer: ".concat(this.id, "]")
		}
	}]) && d(t.prototype, n), r && d(t, r), e
}();

function v(e, t, n, r) {
	return y.apply(this, arguments)
}

function y() {
	return (y = f(regeneratorRuntime.mark((function e(t, n, r, i) {
		var o, a, s, c, u, l, h;
		return regeneratorRuntime.wrap((function (e) {
			for (;;) switch (e.prev = e.next) {
				case 0:
					if (void 0 !== n.testproxyURL) {
						e.next = 2;
						break
					}
					return e.abrupt("return");
				case 2:
					o = (o = t.sdp.split("\r\n")).filter((function (e) {
						return !e.startsWith("a=candidate") || e.includes("127.0.0.1") && e.includes("udp")
					})), a = 0;
				case 5:
					if (!(a < o.length)) {
						e.next = 20;
						break
					}
					if (!(s = o[a]).startsWith("a=candidate") || !s.includes("127.0.0.1")) {
						e.next = 17;
						break
					}
					if (null == (u = null === (c = s.split("127.0.0.1 ").pop()) || void 0 === c ? void 0 : c.split(" ")[0])) {
						e.next = 17;
						break
					}
					return e.next = 12, fetch("".concat(n.testproxyURL, "/create?id=").concat(r + i, "&port=").concat(u));
				case 12:
					return l = e.sent, e.next = 15, l.text();
				case 15:
					h = e.sent, o[a] = s.replaceAll(" ".concat(u, " "), " ".concat(h, " "));
				case 17:
					a++, e.next = 5;
					break;
				case 20:
					t.sdp = o.join("\r\n");
				case 22:
				case "end":
					return e.stop()
			}
		}), e)
	})))).apply(this, arguments)
}

function w(e) {
	return (w = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
		return typeof e
	} : function (e) {
		return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
	})(e)
}

function b(e, t) {
	var n = "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
	if (!n) {
		if (Array.isArray(e) || (n = function (e, t) {
				if (!e) return;
				if ("string" == typeof e) return m(e, t);
				var n = Object.prototype.toString.call(e).slice(8, -1);
				"Object" === n && e.constructor && (n = e.constructor.name);
				if ("Map" === n || "Set" === n) return Array.from(e);
				if ("Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return m(e, t)
			}(e)) || t && e && "number" == typeof e.length) {
			n && (e = n);
			var r = 0,
				i = function () {};
			return {
				s: i,
				n: function () {
					return r >= e.length ? {
						done: !0
					} : {
						done: !1,
						value: e[r++]
					}
				},
				e: function (e) {
					function t(t) {
						return e.apply(this, arguments)
					}
					return t.toString = function () {
						return e.toString()
					}, t
				}((function (e) {
					throw e
				})),
				f: i
			}
		}
		throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
	}
	var o, a = !0,
		s = !1;
	return {
		s: function () {
			n = n.call(e)
		},
		n: function () {
			var e = n.next();
			return a = e.done, e
		},
		e: function (e) {
			function t(t) {
				return e.apply(this, arguments)
			}
			return t.toString = function () {
				return e.toString()
			}, t
		}((function (e) {
			s = !0, o = e
		})),
		f: function () {
			try {
				a || null == n.return || n.return()
			} finally {
				if (s) throw o
			}
		}
	}
}

function m(e, t) {
	(null == t || t > e.length) && (t = e.length);
	for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
	return r
}

function k(e, t) {
	if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
}

function S(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
	}
}

function x(e, t) {
	return (x = Object.setPrototypeOf || function (e, t) {
		return e.__proto__ = t, e
	})(e, t)
}

function O(e) {
	var t = function () {
		if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
		if (Reflect.construct.sham) return !1;
		if ("function" == typeof Proxy) return !0;
		try {
			return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function () {}))), !0
		} catch (e) {
			return !1
		}
	}();
	return function () {
		var n, r = E(e);
		if (t) {
			var i = E(this).constructor;
			n = Reflect.construct(r, arguments, i)
		} else n = r.apply(this, arguments);
		return j(this, n)
	}
}

function j(e, t) {
	return !t || "object" !== w(t) && "function" != typeof t ? P(e) : t
}

function P(e) {
	if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e
}

function E(e) {
	return (E = Object.setPrototypeOf ? Object.getPrototypeOf : function (e) {
		return e.__proto__ || Object.getPrototypeOf(e)
	})(e)
}

function R(e, t, n) {
	return t in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e
}
var A = function (t) {
	! function (e, t) {
		if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function");
		e.prototype = Object.create(t && t.prototype, {
			constructor: {
				value: e,
				writable: !0,
				configurable: !0
			}
		}), t && x(e, t)
	}(s, e);
	var n, i, o, a = O(s);

	function s(e) {
		var t, n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : C,
			i = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : I;
		return k(this, s), R(P(t = a.call(this)), "_closing", !1), R(P(t), "dataChannels", D), R(P(t), "log", console.log), t.gameID = e, t.signalingURL = n, t.rtcConfig = i, t.peers = new Map, t.signaling = new r(P(t), t.peers, n), t
	}
	return n = s, (i = [{
		key: "create",
		value: function () {
			this.signaling.send({
				type: "create",
				game: this.gameID
			})
		}
	}, {
		key: "join",
		value: function (e) {
			this.signaling.send({
				type: "join",
				game: this.gameID,
				lobby: e
			})
		}
	}, {
		key: "close",
		value: function (e) {
			if (!this._closing) {
				this._closing = !0, this.emit("close", e);
				var t, n = b(this.peers.values());
				try {
					for (n.s(); !(t = n.n()).done;) t.value.close(e)
				} catch (e) {
					n.e(e)
				} finally {
					n.f()
				}
				this.signaling.close(e)
			}
		}
	}, {
		key: "send",
		value: function (e, t, n) {
			if (!(e in this.dataChannels)) throw new Error("unknown channel " + e);
			var r;
			this.peers.has(t) && (null === (r = this.peers.get(t)) || void 0 === r || r.send(e, n))
		}
	}, {
		key: "broadcast",
		value: function (e, t) {
			if (!(e in this.dataChannels)) throw new Error("unknown channel " + e);
			var n, r = b(this.peers.values());
			try {
				for (r.s(); !(n = r.n()).done;) n.value.send(e, t)
			} catch (e) {
				r.e(e)
			} finally {
				r.f()
			}
		}
	}, {
		key: "_addPeer",
		value: function (e, t) {
			var n = new g(this, this.signaling, e, this.rtcConfig, t);
			return this.peers.set(e, n), n
		}
	}, {
		key: "_removePeer",
		value: function (e) {
			return this.peers.delete(e.id)
		}
	}, {
		key: "id",
		get: function () {
			var e;
			return null !== (e = this.signaling.receivedID) && void 0 !== e ? e : ""
		}
	}, {
		key: "closing",
		get: function () {
			return this._closing
		}
	}, {
		key: "size",
		get: function () {
			return this.peers.size
		}
	}]) && S(n.prototype, i), o && S(n, o), s
}();
exports.Network = A;
var C = "ws://localhost:8080/v0/signaling";
exports.DefaultSignalingURL = C;
var I = {
	iceServers: [{
		urls: ["stun:stun.l.google.com:19302", "stun:stun3.l.google.com:19302"]
	}, {
		urls: ["turn:localhost:8080"],
		username: "optional-username",
		credential: "secret",
		credentialType: "password"
	}]
};
exports.DefaultRTCConfiguration = I;
var D = {
	reliable: {
		ordered: !0
	},
	unreliable: {
		ordered: !0,
		maxRetransmits: 0
	},
	control: {
		ordered: !1
	}
};
exports.DefaultDataChannels = D;
//# sourceMappingURL=netlib.js.map
