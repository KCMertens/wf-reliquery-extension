"use strict"

// This file is transformed by Gulp (ES2015) for compatibility with iOS
// The native version is available at src/app.js

// We use more than Fetch, but it's an easy way to catch browsers that definitely won't work and get the attention of users who won't read the Welcome page before posting about the page not working
if (typeof fetch === "undefined") {
	alert(document._L.error_unsupported_browser)
	throw "UnsupportedBrowser"
}

// Localization data is loaded ahead of us
let L = document._L

// Mmm
let LS = new Proxy(new Object(), {
	get: function(obj, prop) {
		return localStorage.getItem(prop)
	},
	set: function(obj, prop, value) {
		localStorage.setItem(prop, value)
		return true
	}
})

// Generic helpers
const chomp = (str, what) => {
	const pos = str.lastIndexOf(what)
	if (pos) {
		return str.slice(0, pos)
	}
	return str
}

const roundSingleDecimal = n => Math.round(n * 10) / 10

// JS, please. This is fresh hell.
Object.defineProperty(Object.prototype, "forEach", {
	value: function(func, context) {
		context = context || this
		let keys = Object.keys(this)
		for (let k of keys) {
			func.call(context, this[k], k)
		}
	},
	writable: false,
	configurable: false,
	enumerable: false
})

// Request helpers
const fetchJson = (...args) => fetch(...args).then(response => response.json())
const loadJsonCache = filename => fetchJson("/json/"+filename+".json")

// Element helpers
const childAccessor = function(key) {
	return this["_"+key]
}
const elementKey = e => {
	if (e.getAttribute("key")) {
		return e.getAttribute("key")
	}
	else if (e.id) {
		return e.id
	}
	else if (e.className) {
		return e.classList[0]
	}
}
const showIf = function(shown) {
	this.classList.toggle("hidden", !shown)
}
const hideIf = function(hidden) {
	this.classList.toggle("hidden", hidden)
}
const show = function() {
	this.classList.toggle("hidden", true)
}
const hide = function() {
	this.classList.toggle("hidden", false)
}
const mapChildren = e => {
	for (let i = 0; i < e.children.length; i++) {
		let child = e.children[i]
		let key = elementKey(child)
		if (key) {
			child.removeAttribute("key")
			child._key = key
			e["_"+key] = child
		}
		mapChildren(child)
	}
	e.showIf = showIf
	e.hideIf = hideIf
	e.show = show
	e.hide = hide
	e._ = childAccessor
	return e
}
const mapId = id => mapChildren(document.getElementById(id))

const removeChildren = e => {
	while (e.firstChild) {
		e.removeChild(e.firstChild)
	}
}

// Template helpers
const templateNew = function() {
	return mapChildren(this._node.cloneNode(true))
}

const Template = function(e) {
	this._node = e
	this.new = templateNew
	for (var i = 0; i < e.children.length; i++) {
		let key = elementKey(e.children[i])
		if (key) {
			this[key] = new Template(e.children[i])
		}
	}
}

const tpl = new Template(document.getElementById("templates"))

// Map main page elements
const nav = mapId("nav")
const tokenInfo = mapId("tokeninfo")
const content = mapId("content")
const tabList = ["wishlist", "inventory", "reliquary", "codex", "welcome"]
const themes = mapId("themes")
const platforms = mapId("platforms")

let worldState = {
	platform: null,
	timer: null,
	visible: false,
	// Not going to do anything yet anyway, redefined later
	stayFresh() {},
	onShow() {
		this.visible = true
		if (!this.timer) {
			this.timer = window.setInterval(this.stayFresh, 60000)
		}
		this.stayFresh()
	},
	onHide(onlyStopTimer) {
		if (!onlyStopTimer) {
			this.visible = false
		}
		if (this.timer) {
			window.clearInterval(this.timer)
			this.timer = null
		}
	}
}

// Themes
const setTheme = name => {
	LS.theme = name
	themes.children.forEach(e => e.classList.toggle("active", name === e._key))
	document.body.className = "theme-"+name
}
setTheme(LS.theme || "light")
themes.children.forEach(e => e.addEventListener("click", () => setTheme(e._key)))

// Platforms
const setPlatform = name => {
	LS.platform = name
	// Someone might have another tab open with another platform
	worldState.platform = name
	platforms.children.forEach(e => e.classList.toggle("active", name === e._key))
	worldState.stayFresh()
}
setPlatform(LS.platform || "pc")
platforms.children.forEach(e => e.addEventListener("click", () => setPlatform(e._key)))

let currentTab

// Data
// let missionDecks = {}

// Tokenlist helpers
let tokenList = []
let mainToken

let tokenData = {}
let wishlistedItems = new Set()
let wishlistNodes = []
let wishlistMap = {}

const tokensFromUrl = () => window.location.pathname.substr(1).split(",").filter(x => x)

// Wishlist page helpers
const updateWishlistNode = _item => {
	if (tokenData[mainToken]) {
		const wants = tokenData[mainToken].wants.includes(_item.item.name)
		_item.classList.toggle("wanted", wants)
		_item._label._check.disabled = !tokenData[mainToken].private
		_item._label._check.checked = wants
	}
}
const updateWishlistNodes = () => {
	wishlistNodes.forEach(updateWishlistNode)
}

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

const tabFromUrl = () => {
	const anchor = window.location.hash.substr(1)
	if (tabList.includes(anchor)) {
		return anchor
	}
	if (tokenList.length > 1 || (mainToken && !tokenData[mainToken].private)) {
		return "reliquary"
	}
	else if (mainToken) {
		return "wishlist"
	}
	else {
		return "welcome"
	}
}

const fetchTokenData = tokens => {
	if (tokens.length) {
		const tokenFormData = new FormData()
		tokenFormData.append("tokens", tokens)
		return fetchJson("/api/load", {
			method: "POST",
			body: tokenFormData
		})
		// .then(data => {
		// 	if (arraysEqual(Object.keys(data), tokens)) {
		// 		return Promise.reject(new Error("Token data returned did not match token list requested"))
		// 	}
		// 	return data
		// })
	}
	return Promise.resolve({})
}

const onTokenDataUpdate = () => {
	tokenList = Object.keys(tokenData)
	mainToken = tokenList[0]
	tokenInfo.showIf(mainToken)
	content._wishlist._form._save.setAttribute("value", mainToken ? L.button_update_wishlist : L.button_save_wishlist)
	wishlistedItems = new Set(mainToken ? tokenData[mainToken].wants : null)

	const readOnly = (tokenList.length > 1)
		|| (tokenList.length === 1 && !tokenData[mainToken].private)

	content._wishlist._saving.hideIf(mainToken || readOnly)
	content._wishlist._readonly.showIf(readOnly)
	content._wishlist._form._save.hideIf(readOnly)

	if (mainToken) {
		const data = tokenData[mainToken]
		tokenInfo._form._name.value = data.name
		tokenInfo._form.showIf(data.private)
		tokenInfo._form._save.setAttribute("value", data.name ? L.button_change_nickname : L.button_set_nickname)
		tokenInfo._name.textContent =
			tokenList.length > 1 ? L.text_viewing_multiple_lists :
				(data.private ? "" : data.public_key)
		tokenInfo._token._private.showIf(data.private)
		tokenInfo._token._public.showIf(data.private)
		tokenInfo._token._private._link.href = "/"+data.guid
		tokenInfo._token._private._link.textContent = data.guid ? ".."+data.guid.split("-").pop() : ""
		tokenInfo._token._public._link.href = "/"+data.public_key
		tokenInfo._token._public._link.textContent = data.public_key
	}

	updateUrl()
	updateWishlistNodes()
}


// Initial load
fetchTokenData(tokensFromUrl()).then(data => {
	tokenData = data
	onTokenDataUpdate()
	setTab(tabFromUrl())
})

let partNamesWithoutBlueprint = {}
const rotationMap = {
	"Rotation A": "A",
	"Rotation B": "B",
	"Rotation C": "C"
}
const stageMap = {
	"Stage 1": "1",
	"Stage 2": "2",
	"Stage 3": "3",
	"Stage 4": "4",
	"Stage 5": "5"
}
let relicData
let trackingNodes = {}
// var trackingNodesUnverified = {}
// var relicElements = {}

const renderReliquary = tokenArray => {
	const tokenMap = new Map()

	tokenArray.forEach(data => tokenMap.set(data.guid || data.public_key || data.name, data))

	// Clear tab
	removeChildren(content._reliquary._legend)
	removeChildren(content._reliquary._relics)
	removeChildren(content._reliquary._sources)
	// removeChildren(content._reliquary._unverifiedSources)

	// Aggregate lists
	let wantedRelics = {}
	let allTokensWant = {}
	// console.log("tokenArray", tokenArray)
	tokenMap.forEach((data, token) => {
		data.wants.forEach(item => {
			if (!allTokensWant[item]) {
				allTokensWant[item] = []
			}
			allTokensWant[item].push(token)
			Object.keys(relicData.items[item].relics).forEach(relic => {
				if (!wantedRelics[relic]) {
					wantedRelics[relic] = []
				}
				wantedRelics[relic].push({
					item: item,
					token: token
				})
			})
		})
	})
	// console.log("tokenMap", tokenMap)
	// console.log("wantedRelics", wantedRelics)
	// console.log("allTokensWant", allTokensWant)
	// Sort by hotness and freshness
	let relicList = Object.keys(wantedRelics)
	relicList.sort((a, b) => {
		let av = relicData.relics[a].vaulted
		let bv = relicData.relics[b].vaulted
		if (av !== bv) {
			return bv ? -1 : 1
		}
		let l = wantedRelics[b].length - wantedRelics[a].length
		if (l === 0) {
			return a < b ? -1 : (a > b ? 1 : 0)
		}
		return l
	})
	// Build UI
	// Pip helper
	let tokens = Array.from(tokenMap.keys())
	let addPip = (e, token) => {
		let pip = document.createElement("div")
		pip.classList.add("pip")
		let i = tokens.indexOf(token)
		if (i < 7) {
			pip.classList.add("c"+(i+1))
		}
		e.append(pip)
		return pip
	}
	// Build legend
	tokens.forEach(token => {
		let data = tokenMap.get(token)
		let _wanker = tpl.nav.wanker.new()
		addPip(_wanker._icon, token)
		_wanker._name.textContent = data.name || data.guid || data.public_key
		content._reliquary._legend.append(_wanker)
	})
	// Reward helper
	const addRelicReward = (e, reward, wantedBy) => {
		const _reward = tpl.nav.reward.new()
		_reward._name.textContent = partNamesWithoutBlueprint[reward.name] || reward.name
		_reward._chance.textContent = Math.round(reward.chance.Intact)+"-"+Math.round(reward.chance.Radiant)+"%"
		if (wantedBy) {
			_reward.classList.add("wanted")
			wantedBy.forEach(token => addPip(_reward._wankers, token))
		}
		e.append(_reward)
	}
	// Build relic list
	const deckChanceList = {}
	// const unverifiedDecks = {}
	relicList.forEach(relicName => {
		const _relic = tpl.nav.relic.new()
		const relic = relicData.relics[relicName]
		_relic._header._name.textContent = relicName
		if (relic.vaulted) {
			_relic.classList.add("vaulted")
			_relic._header._vaulted.textContent = L.text_vaulted
		}
		// else {
		// 	_relic._header._check._input.addEventListener('change', function() {

		// 	})
		// }
		_relic._details.prepend(_relic._header.cloneNode(true))
		// Order rewards by base drop chance
		relic.rewards.sort((a, b) => {
			if (a.chance.Intact === b.chance.Intact) {
				return 0
			}
			return a.chance.Intact > b.chance.Intact ? -1 : 1
		})
		relic.rewards.forEach(reward => {
			let tokens
			// Wanted drops
			if (reward.name in allTokensWant) {
				tokens = allTokensWant[reward.name]
				addRelicReward(_relic._rewards, reward, tokens)
			}
			// All drops
			addRelicReward(_relic._details._rewards, reward, tokens)
		})
		content._reliquary._relics.append(_relic)
		// Relic drop locations
		if (!relic.vaulted) {
			relic.sources.forEach((deckData, deckName) => {
				if (deckData.stages) {
					if (!deckChanceList[deckName]) {
						deckChanceList[deckName] = {
							stages: {},
							total: deckData.totalStages
						}
						stageMap.forEach(v => {
							deckChanceList[deckName].stages[v] = {
								chanceSets: {},
								sum: 0
							}
						})
					}
					deckData.stages.forEach((chance, stage) => {
						let list = deckChanceList[deckName].stages[stage]
						list.sum += chance
						if (!list.chanceSets[chance]) {
							list.chanceSets[chance] = []
						}
						list.chanceSets[chance].push(relicName)
					})
				}
				else {
					if (!deckChanceList[deckName]) {
						deckChanceList[deckName] = {
							rotations: {},
							total: deckData.totalRotations
						}
						rotationMap.forEach(v => {
							deckChanceList[deckName].rotations[v] = {
								chanceSets: {},
								sum: 0
							}
						})
					}
					deckData.rotations.forEach((chance, rotation) => {
						let list = deckChanceList[deckName].rotations[rotationMap[rotation]]
						list.sum += chance
						if (!list.chanceSets[chance]) {
							list.chanceSets[chance] = []
						}
						list.chanceSets[chance].push(relicName)
					})
				}
			})
		}
	})
	// Sort by average desire
	// "Average" is very flexible here
	deckChanceList.forEach((r, name) => {
		let average
		// Meh
		// Meh
		if (r.stages) {
			let sum = 0
			let n = 0
			r.stages.forEach(x => {
				sum += x.sum
				n++
			})
			average = sum/n
		}
		else if (name.includes("Spy") || name.includes("Rush")) {
			average = r.rotations.A.sum + r.rotations.B.sum + r.rotations.C.sum
		}
		else if (r.total === 1 || (r.rotations.B.sum === 0 && r.rotations.C.sum === 0)) {
			average = r.rotations.A.sum
		}
		else if (r.rotations.A.sum > 0 && r.rotations.B.sum > 0 && r.rotations.C.sum === 0) {
			average = (r.rotations.A.sum + r.rotations.A.sum + r.rotations.B.sum) / 3
		}
		else {
			average = (r.rotations.A.sum + r.rotations.A.sum + r.rotations.B.sum + r.rotations.C.sum) / 4
		}
		r.average = roundSingleDecimal(average)
	})
	let deckNames = Object.keys(deckChanceList)
	deckNames.sort((a, b) => deckChanceList[a].average > deckChanceList[b].average ? -1 : 1)
	// Build deck list
	// literal headaches
	// I didn't actually get a headache but I should have
	// Again not gonna DRY it out. Because I'm lazy
	trackingNodes = {}
	const reBounty = /Level (\d+) - (\d+) (.+) Bounty/
	deckNames.forEach(name => {
		const list = deckChanceList[name]
		// Over wanted decks with any items (redundant?)
		if (list.average > 0) {
			let _source = tpl.nav.source.new()
			_source._header._name.textContent = relicData.tableNameMap[name] || name
			_source._header._average.textContent = Math.round(list.average)
			// Over rotations with any relics
			let set
			let prefix
			if (list.stages) {
				set = list.stages
				prefix = L.text_stage
				_source.classList.add('bounty')
				const offset = name.lastIndexOf("Rewards")
				const rotation = name.slice(offset-1, offset)
				const matches = reBounty.exec(relicData.tableNameMap[name] || name)
				if (matches) {
					_source._header._name.textContent = `${matches[3]} - ${matches[1]}-${matches[2]}`
				}
				_source._header._name.textContent += " ("+rotation+")"
			}
			else {
				set = list.rotations
				prefix = L.text_rotation
			}
			_source._details.prepend(_source._header.cloneNode(true))
			set.forEach((v, setName) => {
				if (v.sum > 0) {
					let _rotation = tpl.nav.rotation.new()
					_rotation._header._name.textContent = prefix+" "+setName
					_rotation._header._chance.textContent = Math.round(v.sum)
					// Over chance sets within the rotation
					v.chanceSets.forEach((relics, chance) => {
						let _set = tpl.nav.set.new()
						relics.sort()
						_set._relics.innerHTML = relics.map(relic => `<span relic="${relic}">${relic}</span>`).join(", ")
						_set._chance.textContent = Math.round(chance)
						_rotation._sets.append(_set)
					})
					_source._rotations.append(_rotation)
				}
			})
			// Add nodes
			relicData.sources[name].forEach(node => {
				let _node = tpl.nav.node.new()
				_node._planet.textContent = node.planet
				_node._name.textContent = node.name
				_node._mode.textContent = node.modeName
				_node._faction.textContent = node.factionName
				_source._details._nodes.append(_node)
				trackingNodes[node.codeName || name] = {
					deck: _source,
					node: _node,
					data: node
				}
			})
			content._reliquary._sources.append(_source)
		}
	})
}

const fissureTierMap = {
	VoidT1: "T1",
	VoidT2: "T2",
	VoidT3: "T3",
	VoidT4: "T4"
}
const fissureRelicMap = {
	VoidT1: "Lith",
	VoidT2: "Meso",
	VoidT3: "Neo",
	VoidT4: "Axi"
}

const spawnFissure = fissure => {
	const _node = tpl.nav.fissure.new()
	const label = _node._label
	label._era.textContent = fissureRelicMap[fissure.modifier]
	label._tier.textContent = fissureTierMap[fissure.modifier]
	const loc = _node._location
	loc._timer.textContent = Math.round((fissure.expiry - Date.now())/60000)
	return _node
}

const spawnBounty = bounty => {
	const _node = tpl.nav.bounty.new()
	_node._location._timer.textContent = Math.round((bounty.expiry - Date.now())/60000)
	return _node
}

const spawnEvent = event => {
	const _node = tpl.nav.event.new()
	return _node
}

const renderNodeWorldState = (worldStateData) => {
	// Clear node state
	trackingNodes.forEach(tracked => {
		tracked.deck.classList.remove("active-fissure")
		tracked.deck.classList.remove("active-bounty")
		tracked.node.classList.remove("active-fissure")
		removeChildren(tracked.deck._fissures)
	})
	// Flag active fissures
	worldStateData.fissures.forEach(fissure => {
		if (fissure.expiry > Date.now()) {
			const tracked = trackingNodes[fissure.codeName]
			if (tracked) {
				const _fissure = spawnFissure(fissure)
				tracked.deck.classList.add("active-fissure")
				tracked.node.classList.add("active-fissure")

				_fissure._label._mode.textContent = tracked.data.modeName
				_fissure._label._faction.textContent = tracked.data.factionName
				_fissure._location._name.textContent = tracked.data.name
				_fissure._location._planet.textContent = tracked.data.planet
				tracked.deck._fissures.append(_fissure)
			}
		}
	})
	// Flag active bounties
	worldStateData.bounties.forEach((data, faction) => {
		data.active.forEach(table => {
			const tracked = trackingNodes[table]
			if (tracked) {
				const _bounty = spawnBounty(data)
				tracked.deck.classList.add("active-bounty")

				_bounty._location._name.textContent = tracked.data.name
				_bounty._location._planet.textContent = tracked.data.planet
				tracked.deck._fissures.append(_bounty)
			}
		})
	})
	// Flag active events
	worldStateData.events.forEach(event => {
		const tracked = trackingNodes[event.rewardTable]
		if (tracked) {
			const _event = spawnEvent(event)
			tracked.deck.classList.add("active-bounty")

			_event._location._name.textContent = tracked.data.name
			_event._location._planet.textContent = tracked.data.planet
			tracked.deck._fissures.append(_event)
		}
	})
}

// We don't want to fetch the world state again every time the relic page is opened.
// So we track if we've skipped an update and should fetch again
worldState.stayFresh = function() {
	const stateKey = "worldstate_"+worldState.platform
	const timeKey = stateKey+"_timestamp"
	if (
		// No state (This could be called in-flight, so don't check data)
		!LS[timeKey]
		// Old state
		|| LS[timeKey] < Date.now() - 60000
	) {
		LS[timeKey] = Date.now()
		loadJsonCache(stateKey).then(data => {
			LS[stateKey] = JSON.stringify(data)
			renderNodeWorldState(data)
		})
	}
	else {
		// Valid state stored
		if (LS[stateKey]) {
			renderNodeWorldState(JSON.parse(LS[stateKey]))
		}
		// No valid state found (Pending request from another tab?)
		else {
			window.setTimeout(1000, () => worldState.stayFresh())
		}
	}
}

// If the page isn't even visible, we don't want to be getting anything (pls no kill server)
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible") {
		if (worldState.visible) {
			worldState.onShow()
		}
	}
	else {
		if (worldState.visible) {
			worldState.onHide(true)
		}
	}
})

const updateTitle = () => {
	let suffix = ""
	if (currentTab) {
		suffix = " - "+L["tab_"+currentTab]
	}
	if (tokenList.length === 1 && tokenList[0]) {
		const data = tokenData[tokenList[0]]
		if (data.name) {
			document.title = data.name+suffix
			return
		}
	}
	document.title = L.site_title+suffix
}

// TODO: Fix history mangling
// This also mangles bookmarks
const updateUrl = () => {
	updateTitle()
	let oldHash = window.location.hash
	if (tokenList.length) {
		let url = "/"+tokenList.join(",")
		window.history.replaceState({}, "", url)
	}
	else {
		window.history.replaceState({}, "", "/")
	}
	if (currentTab) {
		window.location.hash = "#"+currentTab
	}
	else {
		window.location.hash = oldHash
	}
}

let reliquaryDataRequested = false
const setTab = tab => {
	currentTab = tab
	tabList.forEach(name => {
		nav._(name).classList.toggle("active", name == tab)
		content._(name).classList.toggle("active", name == tab)
	})
	updateUrl()
	if (tab === "reliquary") {
		const tokenArray = []
		tokenList.forEach(token => tokenArray.push(tokenData[token]))
		if (!tokenArray[0]) {
			tokenArray[0] = {
				name: "("+L.text_wishlist_unsaved+")",
				has: {}
			}
		}
		tokenArray[0].wants = Array.from(wishlistedItems.values())
		// No wishlisted items
		let wanted = 0
		tokenArray.forEach(data => wanted += data.wants.length)
		content._reliquary._empty.showIf(wanted == 0)
		content._reliquary._legend.hideIf(wanted == 0)
		// Initial nav load
		// if (wanted === 0) {
		// 	content._reliquary._legend.textContent = L.text_reliquary_empty
		// }
		// else
		if (!reliquaryDataRequested) {
			reliquaryDataRequested = true
			loadJsonCache("relictables").then(data => {
				relicData = data
				renderReliquary(tokenArray)
				worldState.onShow()
			})
		}
		else {
			// Make sure we're showing a fresh version of the worldstate
			renderReliquary(tokenArray)
			worldState.onShow()
		}
	}
	else {
		worldState.onHide()
	}
}

// setTab("wishlist")

const clickTab = function() {
	setTab(this.tabname)
}

tabList.forEach(name => {
	const e = nav._(name)
	e.tabname = name
	e.addEventListener("click", clickTab)
})

const submitTokenForm = (formName, form) => {
	const formData = new FormData(form)
	formData.append("token", mainToken)
	formData.append("form", formName)
	return fetchJson("/api/store", {
		method: "POST",
		body: formData
	})
}

var onWishlistItemClick = function() {
	const wanted = this._label._check.checked
	this.classList.toggle("wanted", wanted)
	if (wanted) {
		wishlistedItems.add(this.item.name)
	}
	else {
		wishlistedItems.delete(this.item.name)
	}
}

// Load wishlist page
loadJsonCache("wishlist").then(data => {
	const buildItem = (item, setName) => {
		const _item = tpl.wish.item.new()
		_item.addEventListener("click", onWishlistItemClick)
		_item.item = item
		_item._label._check.name = "wants["+item.name+"]"
		let text = item.name
		if (setName) {
			// Trim set name from item
			if (item.name.startsWith(setName)) {
				text = item.name.slice(setName.length+1)
				// Trim blueprint label from set parts
				const offset = text.lastIndexOf(" Blueprint")
				if (offset > 0) {
					text = text.slice(0, offset)
					partNamesWithoutBlueprint[item.name] = chomp(item.name, " Blueprint")
				}
			}
		}
		_item._label._text.textContent = text
		wishlistMap[item.name] = _item
		wishlistNodes.push(_item)
		return _item
	}

	const list = content._wishlist._form._list

	// const sorted = data.sort((a, b) => {
	// 	if ("parts" in a !== "parts" in b) {
	// 		return "parts" in a ? -1 : 1
	// 	}
	// 	if (a.parts)
	// 	const alpha = (a.name > b.name) ? 1 : (a.name < b.name ? -1 : 0)
	// 	return a.vaulted === b.vaulted ? alpha : (b.vaulted ? -1 : 1)
	// })
	data.forEach(set => {
		// Item set (primes)
		if (set.parts) {
			let _set = tpl.wish.set.new()
			_set._header._name.textContent = set.name
			_set._header._wikilink.setAttribute("href", "//warframe.wikia.com/wiki/"+set.name.replace(" ", "_"))
			if (set.vaulted) {
				_set.classList.add("vaulted")
			}
			if (set.type) {
				_set._header._type.src = "/icons/filters/"+set.type+".png"
			}
			set.parts.forEach(part => _set._parts.appendChild(buildItem(part, set.name)))
			list.appendChild(_set)
		}
		// Single items/orphans
		else {
			list.appendChild(buildItem(set))
		}
	})
	updateWishlistNodes()

	let responseHandler = data => {
		// console.log("responseHandler", data)
		tokenData[data.guid] = data
		onTokenDataUpdate()
	}

	content._wishlist._form._save.addEventListener("click", () => {
		submitTokenForm("wishlist", content._wishlist._form).then(responseHandler)
	})

	tokenInfo._form._save.addEventListener("click", () => {
		submitTokenForm("name", tokenInfo._form).then(responseHandler)
	})
})