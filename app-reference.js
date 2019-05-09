"use strict";

// This file is transformed by Gulp (ES2015) for compatibility with iOS
// The native version is available at src/app.js

// We use more than Fetch, but it's an easy way to catch browsers that definitely won't work and get the attention of users who won't read the Welcome page before posting about the page not working

if (typeof fetch === "undefined") {
	alert(document._L.error_unsupported_browser);
	throw "UnsupportedBrowser";
}

// Localization data is loaded ahead of us
var L = document._L;

// Mmm
var LS = new Proxy(new Object(), {
	get: function get(obj, prop) {
		return localStorage.getItem(prop);
	},
	set: function set(obj, prop, value) {
		localStorage.setItem(prop, value);
		return true;
	}
});

// Generic helpers
var chomp = function chomp(str, what) {
	var pos = str.lastIndexOf(what);
	if (pos) {
		return str.slice(0, pos);
	}
	return str;
};

var roundSingleDecimal = function roundSingleDecimal(n) {
	return Math.round(n * 10) / 10;
};

// JS, please. This is fresh hell.
Object.defineProperty(Object.prototype, "forEach", {
	value: function value(func, context) {
		context = context || this;
		var keys = Object.keys(this);
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var k = _step.value;

				func.call(context, this[k], k);
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}
	},
	writable: false,
	configurable: false,
	enumerable: false
});

// Request helpers
var fetchJson = function fetchJson() {
	return fetch.apply(undefined, arguments).then(function (response) {
		return response.json();
	});
};
var loadJsonCache = function loadJsonCache(filename) {
	return fetchJson("/json/" + filename + ".json");
};

// Element helpers
var childAccessor = function childAccessor(key) {
	return this["_" + key];
};
var elementKey = function elementKey(e) {
	if (e.getAttribute("key")) {
		return e.getAttribute("key");
	} else if (e.id) {
		return e.id;
	} else if (e.className) {
		return e.classList[0];
	}
};
var showIf = function showIf(shown) {
	this.classList.toggle("hidden", !shown);
};
var hideIf = function hideIf(hidden) {
	this.classList.toggle("hidden", hidden);
};
var show = function show() {
	this.classList.toggle("hidden", true);
};
var hide = function hide() {
	this.classList.toggle("hidden", false);
};
var mapChildren = function mapChildren(e) {
	for (var i = 0; i < e.children.length; i++) {
		var child = e.children[i];
		var key = elementKey(child);
		if (key) {
			child.removeAttribute("key");
			child._key = key;
			e["_" + key] = child;
		}
		mapChildren(child);
	}
	e.showIf = showIf;
	e.hideIf = hideIf;
	e.show = show;
	e.hide = hide;
	e._ = childAccessor;
	return e;
};
var mapId = function mapId(id) {
	return mapChildren(document.getElementById(id));
};

var removeChildren = function removeChildren(e) {
	while (e.firstChild) {
		e.removeChild(e.firstChild);
	}
};

// Template helpers
var templateNew = function templateNew() {
	return mapChildren(this._node.cloneNode(true));
};

var Template = function Template(e) {
	this._node = e;
	this.new = templateNew;
	for (var i = 0; i < e.children.length; i++) {
		var key = elementKey(e.children[i]);
		if (key) {
			this[key] = new Template(e.children[i]);
		}
	}
};

var tpl = new Template(document.getElementById("templates"));

// Map main page elements
var nav = mapId("nav");
var tokenInfo = mapId("tokeninfo");
var content = mapId("content");
var tabList = ["wishlist", "inventory", "reliquary", "codex", "welcome"];
var themes = mapId("themes");
var platforms = mapId("platforms");

var worldState = {
	platform: null,
	timer: null,
	visible: false,
	// Not going to do anything yet anyway, redefined later
	stayFresh: function stayFresh() {},
	onShow: function onShow() {
		this.visible = true;
		if (!this.timer) {
			this.timer = window.setInterval(this.stayFresh, 60000);
		}
		this.stayFresh();
	},
	onHide: function onHide(onlyStopTimer) {
		if (!onlyStopTimer) {
			this.visible = false;
		}
		if (this.timer) {
			window.clearInterval(this.timer);
			this.timer = null;
		}
	}
};

// Themes
var setTheme = function setTheme(name) {
	LS.theme = name;
	themes.children.forEach(function (e) {
		return e.classList.toggle("active", name === e._key);
	});
	document.body.className = "theme-" + name;
};
setTheme(LS.theme || "light");
themes.children.forEach(function (e) {
	return e.addEventListener("click", function () {
		return setTheme(e._key);
	});
});

// Platforms
var setPlatform = function setPlatform(name) {
	LS.platform = name;
	// Someone might have another tab open with another platform
	worldState.platform = name;
	platforms.children.forEach(function (e) {
		return e.classList.toggle("active", name === e._key);
	});
	worldState.stayFresh();
};
setPlatform(LS.platform || "pc");
platforms.children.forEach(function (e) {
	return e.addEventListener("click", function () {
		return setPlatform(e._key);
	});
});

var currentTab = void 0;

// Data
// let missionDecks = {}

// Tokenlist helpers
var tokenList = [];
var mainToken = void 0;

var tokenData = {};
var wishlistedItems = new Set();
var wishlistNodes = [];
var wishlistMap = {};

var tokensFromUrl = function tokensFromUrl() {
	return window.location.pathname.substr(1).split(",").filter(function (x) {
		return x;
	});
};

// Wishlist page helpers
var updateWishlistNode = function updateWishlistNode(_item) {
	if (tokenData[mainToken]) {
		var wants = tokenData[mainToken].wants.includes(_item.item.name);
		_item.classList.toggle("wanted", wants);
		_item._label._check.disabled = !tokenData[mainToken].private;
		_item._label._check.checked = wants;
	}
};
var updateWishlistNodes = function updateWishlistNodes() {
	wishlistNodes.forEach(updateWishlistNode);
};

// Load token list
// let Token = function(data) {
// 	this.guid = data.guid
// 	this.public_key = data.public_key
// 	this.name = data.name
// 	this.private = data.private
// 	this.wants = data.wants || []
// 	this.has = data.has || {}
// 	this.mastered = data.mastered || []
// 	this.forma = data.format || {}
// }

var tabFromUrl = function tabFromUrl() {
	var anchor = window.location.hash.substr(1);
	if (tabList.includes(anchor)) {
		return anchor;
	}
	if (tokenList.length > 1 || mainToken && !tokenData[mainToken].private) {
		return "reliquary";
	} else if (mainToken) {
		return "wishlist";
	} else {
		return "welcome";
	}
};

var fetchTokenData = function fetchTokenData(tokens) {
	if (tokens.length) {
		var tokenFormData = new FormData();
		tokenFormData.append("tokens", tokens);
		return fetchJson("/api/load", {
			method: "POST",
			body: tokenFormData
		});
		// .then(data => {
		// 	if (arraysEqual(Object.keys(data), tokens)) {
		// 		return Promise.reject(new Error("Token data returned did not match token list requested"))
		// 	}
		// 	return data
		// })
	}
	return Promise.resolve({});
};

var onTokenDataUpdate = function onTokenDataUpdate() {
	tokenList = Object.keys(tokenData);
	mainToken = tokenList[0];
	tokenInfo.showIf(mainToken);
	content._wishlist._form._save.setAttribute("value", mainToken ? L.button_update_wishlist : L.button_save_wishlist);
	wishlistedItems = new Set(mainToken ? tokenData[mainToken].wants : null);

	var readOnly = tokenList.length > 1 || tokenList.length === 1 && !tokenData[mainToken].private;

	content._wishlist._saving.hideIf(mainToken || readOnly);
	content._wishlist._readonly.showIf(readOnly);
	content._wishlist._form._save.hideIf(readOnly);

	if (mainToken) {
		var data = tokenData[mainToken];
		tokenInfo._form._name.value = data.name;
		tokenInfo._form.showIf(data.private);
		tokenInfo._form._save.setAttribute("value", data.name ? L.button_change_nickname : L.button_set_nickname);
		tokenInfo._name.textContent = tokenList.length > 1 ? L.text_viewing_multiple_lists : data.private ? "" : data.public_key;
		tokenInfo._token._private.showIf(data.private);
		tokenInfo._token._public.showIf(data.private);
		tokenInfo._token._private._link.href = "/" + data.guid;
		tokenInfo._token._private._link.textContent = data.guid ? ".." + data.guid.split("-").pop() : "";
		tokenInfo._token._public._link.href = "/" + data.public_key;
		tokenInfo._token._public._link.textContent = data.public_key;
	}

	updateUrl();
	updateWishlistNodes();
};

// Initial load
fetchTokenData(tokensFromUrl()).then(function (data) {
	tokenData = data;
	onTokenDataUpdate();
	setTab(tabFromUrl());
});

var partNamesWithoutBlueprint = {};
var rotationMap = {
	"Rotation A": "A",
	"Rotation B": "B",
	"Rotation C": "C"
};
var stageMap = {
	"Stage 1": "1",
	"Stage 2": "2",
	"Stage 3": "3",
	"Stage 4": "4",
	"Stage 5": "5"
};
var relicData = void 0;
var trackingNodes = {};
// var trackingNodesUnverified = {}
// var relicElements = {}

var renderReliquary = function renderReliquary(tokenArray) {
	var tokenMap = new Map();

	tokenArray.forEach(function (data) {
		return tokenMap.set(data.guid || data.public_key || data.name, data);
	});

	// Clear tab
	removeChildren(content._reliquary._legend);
	removeChildren(content._reliquary._relics);
	removeChildren(content._reliquary._sources);
	// removeChildren(content._reliquary._unverifiedSources)

	// Aggregate lists
	var wantedRelics = {};
	var allTokensWant = {};
	// console.log("tokenArray", tokenArray)
	tokenMap.forEach(function (data, token) {
		data.wants.forEach(function (item) {
			if (!allTokensWant[item]) {
				allTokensWant[item] = [];
			}
			allTokensWant[item].push(token);
			Object.keys(relicData.items[item].relics).forEach(function (relic) {
				if (!wantedRelics[relic]) {
					wantedRelics[relic] = [];
				}
				wantedRelics[relic].push({
					item: item,
					token: token
				});
			});
		});
	});
	// console.log("tokenMap", tokenMap)
	// console.log("wantedRelics", wantedRelics)
	// console.log("allTokensWant", allTokensWant)
	// Sort by hotness and freshness
	var relicList = Object.keys(wantedRelics);
	relicList.sort(function (a, b) {
		var av = relicData.relics[a].vaulted;
		var bv = relicData.relics[b].vaulted;
		if (av !== bv) {
			return bv ? -1 : 1;
		}
		var l = wantedRelics[b].length - wantedRelics[a].length;
		if (l === 0) {
			return a < b ? -1 : a > b ? 1 : 0;
		}
		return l;
	});
	// Build UI
	// Pip helper
	var tokens = Array.from(tokenMap.keys());
	var addPip = function addPip(e, token) {
		var pip = document.createElement("div");
		pip.classList.add("pip");
		var i = tokens.indexOf(token);
		if (i < 7) {
			pip.classList.add("c" + (i + 1));
		}
		e.append(pip);
		return pip;
	};
	// Build legend
	tokens.forEach(function (token) {
		var data = tokenMap.get(token);
		var _wanker = tpl.nav.wanker.new();
		addPip(_wanker._icon, token);
		_wanker._name.textContent = data.name || data.guid || data.public_key;
		content._reliquary._legend.append(_wanker);
	});
	// Reward helper
	var addRelicReward = function addRelicReward(e, reward, wantedBy) {
		var _reward = tpl.nav.reward.new();
		_reward._name.textContent = partNamesWithoutBlueprint[reward.name] || reward.name;
		_reward._chance.textContent = Math.round(reward.chance.Intact) + "-" + Math.round(reward.chance.Radiant) + "%";
		if (wantedBy) {
			_reward.classList.add("wanted");
			wantedBy.forEach(function (token) {
				return addPip(_reward._wankers, token);
			});
		}
		e.append(_reward);
	};
	// Build relic list
	var deckChanceList = {};
	// const unverifiedDecks = {}
	relicList.forEach(function (relicName) {
		var _relic = tpl.nav.relic.new();
		var relic = relicData.relics[relicName];
		_relic._header._name.textContent = relicName;
		if (relic.vaulted) {
			_relic.classList.add("vaulted");
			_relic._header._vaulted.textContent = L.text_vaulted;
		}
		_relic._details.prepend(_relic._header.cloneNode(true));
		// Order rewards by base drop chance
		relic.rewards.sort(function (a, b) {
			if (a.chance.Intact === b.chance.Intact) {
				return 0;
			}
			return a.chance.Intact > b.chance.Intact ? -1 : 1;
		});
		relic.rewards.forEach(function (reward) {
			var tokens = void 0;
			// Wanted drops
			if (reward.name in allTokensWant) {
				tokens = allTokensWant[reward.name];
				addRelicReward(_relic._rewards, reward, tokens);
			}
			// All drops
			addRelicReward(_relic._details._rewards, reward, tokens);
		});
		content._reliquary._relics.append(_relic);
		// Relic drop locations
		if (!relic.vaulted) {
			relic.sources.forEach(function (deckData, deckName) {
				if (deckData.stages) {
					if (!deckChanceList[deckName]) {
						deckChanceList[deckName] = {
							stages: {},
							total: deckData.totalStages
						};
						stageMap.forEach(function (v) {
							deckChanceList[deckName].stages[v] = {
								chanceSets: {},
								sum: 0
							};
						});
					}
					deckData.stages.forEach(function (chance, stage) {
						var list = deckChanceList[deckName].stages[stage];
						list.sum += chance;
						if (!list.chanceSets[chance]) {
							list.chanceSets[chance] = [];
						}
						list.chanceSets[chance].push(relicName);
					});
				} else {
					if (!deckChanceList[deckName]) {
						deckChanceList[deckName] = {
							rotations: {},
							total: deckData.totalRotations
						};
						rotationMap.forEach(function (v) {
							deckChanceList[deckName].rotations[v] = {
								chanceSets: {},
								sum: 0
							};
						});
					}
					deckData.rotations.forEach(function (chance, rotation) {
						var list = deckChanceList[deckName].rotations[rotationMap[rotation]];
						list.sum += chance;
						if (!list.chanceSets[chance]) {
							list.chanceSets[chance] = [];
						}
						list.chanceSets[chance].push(relicName);
					});
				}
			});
		}
	});
	// Sort by average desire
	// "Average" is very flexible here
	deckChanceList.forEach(function (r, name) {
		var average = void 0;
		// Meh
		// Meh
		if (r.stages) {
			var sum = 0;
			var n = 0;
			r.stages.forEach(function (x) {
				sum += x.sum;
				n++;
			});
			average = sum / n;
		} else if (name.includes("Spy") || name.includes("Rush")) {
			average = r.rotations.A.sum + r.rotations.B.sum + r.rotations.C.sum;
		} else if (r.total === 1 || r.rotations.B.sum === 0 && r.rotations.C.sum === 0) {
			average = r.rotations.A.sum;
		} else if (r.rotations.A.sum > 0 && r.rotations.B.sum > 0 && r.rotations.C.sum === 0) {
			average = (r.rotations.A.sum + r.rotations.A.sum + r.rotations.B.sum) / 3;
		} else {
			average = (r.rotations.A.sum + r.rotations.A.sum + r.rotations.B.sum + r.rotations.C.sum) / 4;
		}
		r.average = roundSingleDecimal(average);
	});
	var deckNames = Object.keys(deckChanceList);
	deckNames.sort(function (a, b) {
		return deckChanceList[a].average > deckChanceList[b].average ? -1 : 1;
	});
	// Build deck list
	// literal headaches
	// I didn't actually get a headache but I should have
	// Again not gonna DRY it out. Because I'm lazy
	trackingNodes = {};
	var reBounty = /Level (\d+) - (\d+) (.+) Bounty/;
	deckNames.forEach(function (name) {
		var list = deckChanceList[name];
		// Over wanted decks with any items (redundant?)
		if (list.average > 0) {
			var _source = tpl.nav.source.new();
			_source._header._name.textContent = relicData.tableNameMap[name] || name;
			_source._header._average.textContent = Math.round(list.average);
			// Over rotations with any relics
			var set = void 0;
			var prefix = void 0;
			if (list.stages) {
				set = list.stages;
				prefix = L.text_stage;
				_source.classList.add('bounty');
				var offset = name.lastIndexOf("Rewards");
				var rotation = name.slice(offset - 1, offset);
				var matches = reBounty.exec(relicData.tableNameMap[name] || name);
				if (matches) {
					_source._header._name.textContent = matches[3] + " - " + matches[1] + "-" + matches[2];
				}
				_source._header._name.textContent += " (" + rotation + ")";
			} else {
				set = list.rotations;
				prefix = L.text_rotation;
			}
			_source._details.prepend(_source._header.cloneNode(true));
			set.forEach(function (v, setName) {
				if (v.sum > 0) {
					var _rotation = tpl.nav.rotation.new();
					_rotation._header._name.textContent = prefix + " " + setName;
					_rotation._header._chance.textContent = Math.round(v.sum);
					// Over chance sets within the rotation
					v.chanceSets.forEach(function (relics, chance) {
						var _set = tpl.nav.set.new();
						relics.sort();
						_set._relics.innerHTML = relics.map(function (relic) {
							return "<span relic=\"" + relic + "\">" + relic + "</span>";
						}).join(", ");
						_set._chance.textContent = Math.round(chance);
						_rotation._sets.append(_set);
					});
					_source._rotations.append(_rotation);
				}
			});
			// Add nodes
			relicData.sources[name].forEach(function (node) {
				var _node = tpl.nav.node.new();
				_node._planet.textContent = node.planet;
				_node._name.textContent = node.name;
				_node._mode.textContent = node.modeName;
				_node._faction.textContent = node.factionName;
				_source._details._nodes.append(_node);
				trackingNodes[node.codeName || name] = {
					deck: _source,
					node: _node,
					data: node
				};
			});
			content._reliquary._sources.append(_source);
		}
	});
};

var fissureTierMap = {
	VoidT1: "T1",
	VoidT2: "T2",
	VoidT3: "T3",
	VoidT4: "T4"
};
var fissureRelicMap = {
	VoidT1: "Lith",
	VoidT2: "Meso",
	VoidT3: "Neo",
	VoidT4: "Axi"
};

var spawnFissure = function spawnFissure(fissure) {
	var _node = tpl.nav.fissure.new();
	var label = _node._label;
	label._era.textContent = fissureRelicMap[fissure.modifier];
	label._tier.textContent = fissureTierMap[fissure.modifier];
	var loc = _node._location;
	loc._timer.textContent = Math.round((fissure.expiry - Date.now()) / 60000);
	return _node;
};

var spawnBounty = function spawnBounty(bounty) {
	var _node = tpl.nav.bounty.new();
	_node._location._timer.textContent = Math.round((bounty.expiry - Date.now()) / 60000);
	return _node;
};

var spawnEvent = function spawnEvent(event) {
	var _node = tpl.nav.event.new();
	return _node;
};

var renderNodeWorldState = function renderNodeWorldState(worldStateData) {
	// Clear node state
	trackingNodes.forEach(function (tracked) {
		tracked.deck.classList.remove("active-fissure");
		tracked.deck.classList.remove("active-bounty");
		tracked.node.classList.remove("active-fissure");
		removeChildren(tracked.deck._fissures);
	});
	// Flag active fissures
	worldStateData.fissures.forEach(function (fissure) {
		if (fissure.expiry > Date.now()) {
			var tracked = trackingNodes[fissure.codeName];
			if (tracked) {
				var _fissure = spawnFissure(fissure);
				tracked.deck.classList.add("active-fissure");
				tracked.node.classList.add("active-fissure");

				_fissure._label._mode.textContent = tracked.data.modeName;
				_fissure._label._faction.textContent = tracked.data.factionName;
				_fissure._location._name.textContent = tracked.data.name;
				_fissure._location._planet.textContent = tracked.data.planet;
				tracked.deck._fissures.append(_fissure);
			}
		}
	});
	// Flag active bounties
	worldStateData.bounties.forEach(function (data, faction) {
		data.active.forEach(function (table) {
			var tracked = trackingNodes[table];
			if (tracked) {
				var _bounty = spawnBounty(data);
				tracked.deck.classList.add("active-bounty");

				_bounty._location._name.textContent = tracked.data.name;
				_bounty._location._planet.textContent = tracked.data.planet;
				tracked.deck._fissures.append(_bounty);
			}
		});
	});
	// Flag active events
	worldStateData.events.forEach(function (event) {
		var tracked = trackingNodes[event.rewardTable];
		if (tracked) {
			var _event = spawnEvent(event);
			tracked.deck.classList.add("active-bounty");

			_event._location._name.textContent = tracked.data.name;
			_event._location._planet.textContent = tracked.data.planet;
			tracked.deck._fissures.append(_event);
		}
	});
};

// We don't want to fetch the world state again every time the relic page is opened.
// So we track if we've skipped an update and should fetch again
worldState.stayFresh = function () {
	var stateKey = "worldstate_" + worldState.platform;
	var timeKey = stateKey + "_timestamp";
	if (
	// No state (This could be called in-flight, so don't check data)
	!LS[timeKey]
	// Old state
	|| LS[timeKey] < Date.now() - 60000) {
		LS[timeKey] = Date.now();
		loadJsonCache(stateKey).then(function (data) {
			LS[stateKey] = JSON.stringify(data);
			renderNodeWorldState(data);
		});
	} else {
		// Valid state stored
		if (LS[stateKey]) {
			renderNodeWorldState(JSON.parse(LS[stateKey]));
		}
		// No valid state found (Pending request from another tab?)
		else {
				window.setTimeout(1000, function () {
					return worldState.stayFresh();
				});
			}
	}
};

// If the page isn't even visible, we don't want to be getting anything (pls no kill server)
document.addEventListener("visibilitychange", function () {
	if (document.visibilityState === "visible") {
		if (worldState.visible) {
			worldState.onShow();
		}
	} else {
		if (worldState.visible) {
			worldState.onHide(true);
		}
	}
});

var updateTitle = function updateTitle() {
	var suffix = "";
	if (currentTab) {
		suffix = " - " + L["tab_" + currentTab];
	}
	if (tokenList.length === 1 && tokenList[0]) {
		var data = tokenData[tokenList[0]];
		if (data.name) {
			document.title = data.name + suffix;
			return;
		}
	}
	document.title = L.site_title + suffix;
};

// TODO: Fix history mangling
// This also mangles bookmarks
var updateUrl = function updateUrl() {
	updateTitle();
	var oldHash = window.location.hash;
	if (tokenList.length) {
		var url = "/" + tokenList.join(",");
		window.history.replaceState({}, "", url);
	} else {
		window.history.replaceState({}, "", "/");
	}
	if (currentTab) {
		window.location.hash = "#" + currentTab;
	} else {
		window.location.hash = oldHash;
	}
};

var reliquaryDataRequested = false;
var setTab = function setTab(tab) {
	currentTab = tab;
	tabList.forEach(function (name) {
		nav._(name).classList.toggle("active", name == tab);
		content._(name).classList.toggle("active", name == tab);
	});
	updateUrl();
	if (tab === "reliquary") {
		var tokenArray = [];
		tokenList.forEach(function (token) {
			return tokenArray.push(tokenData[token]);
		});
		if (!tokenArray[0]) {
			tokenArray[0] = {
				name: "(" + L.text_wishlist_unsaved + ")",
				has: {}
			};
		}
		tokenArray[0].wants = Array.from(wishlistedItems.values());
		// No wishlisted items
		var wanted = 0;
		tokenArray.forEach(function (data) {
			return wanted += data.wants.length;
		});
		content._reliquary._empty.showIf(wanted == 0);
		content._reliquary._legend.hideIf(wanted == 0);
		// Initial nav load
		// if (wanted === 0) {
		// 	content._reliquary._legend.textContent = L.text_reliquary_empty
		// }
		// else 
		if (!reliquaryDataRequested) {
			reliquaryDataRequested = true;
			loadJsonCache("relictables").then(function (data) {
				relicData = data;
				renderReliquary(tokenArray);
				worldState.onShow();
			});
		} else {
			// Make sure we're showing a fresh version of the worldstate
			renderReliquary(tokenArray);
			worldState.onShow();
		}
	} else {
		worldState.onHide();
	}
};

// setTab("wishlist")

var clickTab = function clickTab() {
	setTab(this.tabname);
};

tabList.forEach(function (name) {
	var e = nav._(name);
	e.tabname = name;
	e.addEventListener("click", clickTab);
});

var submitTokenForm = function submitTokenForm(formName, form) {
	var formData = new FormData(form);
	formData.append("token", mainToken);
	formData.append("form", formName);
	return fetchJson("/api/store", {
		method: "POST",
		body: formData
	});
};

var onWishlistItemClick = function onWishlistItemClick() {
	var wanted = this._label._check.checked;
	this.classList.toggle("wanted", wanted);
	if (wanted) {
		wishlistedItems.add(this.item.name);
	} else {
		wishlistedItems.delete(this.item.name);
	}
};

// Load wishlist page
loadJsonCache("wishlist").then(function (data) {
	var buildItem = function buildItem(item, setName) {
		var _item = tpl.wish.item.new();
		_item.addEventListener("click", onWishlistItemClick);
		_item.item = item;
		_item._label._check.name = "wants[" + item.name + "]";
		var text = item.name;
		if (setName) {
			// Trim set name from item
			if (item.name.startsWith(setName)) {
				text = item.name.slice(setName.length + 1);
				// Trim blueprint label from set parts
				var offset = text.lastIndexOf(" Blueprint");
				if (offset > 0) {
					text = text.slice(0, offset);
					partNamesWithoutBlueprint[item.name] = chomp(item.name, " Blueprint");
				}
			}
		}
		_item._label._text.textContent = text;
		wishlistMap[item.name] = _item;
		wishlistNodes.push(_item);
		return _item;
	};

	var list = content._wishlist._form._list;

	// const sorted = data.sort((a, b) => {
	// 	if ("parts" in a !== "parts" in b) {
	// 		return "parts" in a ? -1 : 1
	// 	}
	// 	if (a.parts)
	// 	const alpha = (a.name > b.name) ? 1 : (a.name < b.name ? -1 : 0)
	// 	return a.vaulted === b.vaulted ? alpha : (b.vaulted ? -1 : 1)
	// })
	data.forEach(function (set) {
		// Item set (primes)
		if (set.parts) {
			var _set = tpl.wish.set.new();
			_set._header._name.textContent = set.name;
			_set._header._wikilink.setAttribute("href", "//warframe.wikia.com/wiki/" + set.name.replace(" ", "_"));
			if (set.vaulted) {
				_set.classList.add("vaulted");
			}
			if (set.type) {
				_set._header._type.src = "/icons/filters/" + set.type + ".png";
			}
			set.parts.forEach(function (part) {
				return _set._parts.appendChild(buildItem(part, set.name));
			});
			list.appendChild(_set);
		}
		// Single items/orphans
		else {
				list.appendChild(buildItem(set));
			}
	});
	updateWishlistNodes();

	var responseHandler = function responseHandler(data) {
		// console.log("responseHandler", data)
		tokenData[data.guid] = data;
		onTokenDataUpdate();
	};

	content._wishlist._form._save.addEventListener("click", function () {
		submitTokenForm("wishlist", content._wishlist._form).then(responseHandler);
	});

	tokenInfo._form._save.addEventListener("click", function () {
		submitTokenForm("name", tokenInfo._form).then(responseHandler);
	});
});