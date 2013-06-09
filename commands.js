/**
 * System commands
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * These are system commands - commands required for Pokemon Showdown
 * to run. A lot of these are sent by the client.
 *
 * If you'd like to modify commands, please go to config/commands.js,
 * which also teaches you how to use commands.
 *
 * @license MIT license
 */

if (typeof tour == "undefined") {
	tour = new Object();
}
tour.tiers = new Array();
setTimeout(function() {for (var i in Data.base.Formats) {tour.tiers.push(i);}}, 1000);
tour.reset = function(rid) {
	tour[rid] = {
		status: 0,
		tier: undefined,
		size: 0,
		roundNum: 0,
		players: new Array(),
		winners: new Array(),
		losers: new Array(),
		round: new Array(),
		history: new Array()
	};
};
tour.shuffle = function(list) {
  var i, j, t;
  for (i = 1; i < list.length; i++) {
    j = Math.floor(Math.random()*(1+i));  // choose j in [0..i]
    if (j != i) {
      t = list[i];                        // swap list[i] and list[j]
      list[i] = list[j];
      list[j] = t;
    }
  }
  return list;
};
tour.splint = function(target) {
	//splittyDiddles
	var cmdArr =  target.split(",");
	for(var i = 0; i < cmdArr.length; i++) {
		cmdArr[i] = cmdArr[i].trim();
	}
	return cmdArr;
};
tour.join = function(uid, rid) {
	var players = tour[rid].players;
	var init = 0;
	for (var i in players) {
		if (players[i] == uid) {
			init = 1;
		}
	}
	if (init) {
		return false;
	}
	players.push(uid);
	return true;
};
tour.leave = function(uid, rid) {
	var players = tour[rid].players;
	var init = 0;
	var key;
	for (var i in players) {
		if (players[i] == uid) {
			init = 1;
			key = i;
		}
	}
	if (!init) {
		return false;
	}
	players.splice(key, 1);
	return true;
};
tour.lose = function(uid, rid) {
	/*
		if couldn't disqualify return false
		if could disqualify return the opponents userid
	*/
	var r = tour[rid].round;
	for (var i in r) {
		if (r[i][0] == uid) {
			var key = i;
			var p = 0;
		}
		if (r[i][1] == uid) {
			var key = i;
			var p = 1;
		}
	}
	if (!key) {
		//user not in tour
		return -1;
	}
	else {
		if (r[key][1] == undefined) {
			//no opponent
			return 0;
		}
		if (r[key][2] != undefined && r[key][2] != -1) {
			//already did match
			return 1;
		}
		var winner = 0;
		var loser = 1;
		if (p == 0) {
			winner = 1;
			loser = 0;
		}
		r[key][2] = r[key][winner];
		tour[rid].winners.push(r[key][winner]);
		tour[rid].losers.push(r[key][loser]);
		tour[rid].history.push(r[key][winner] + "|" + r[key][loser]);
		return r[key][winner];
	}
};
tour.start = function(rid) {
	var isValid = false;
	var numByes = 0;
	if (tour[rid].size <= 4) {
        	if (tour[rid].size % 2 == 0) {
            		isValid = true;
        	} else {
            		isValid = true;
            		numByes = 1;
		}
	}
		do
		{
			var numPlayers = ((tour[rid].size - numByes) / 2 + numByes);
			do
			{
					numPlayers = numPlayers / 2;
			}
		while (numPlayers > 1);
		if (numPlayers == 1) {
						isValid = true;
			} else {
						numByes += 1;
			}
		}
	while (isValid == false);
	var r = tour[rid].round;
	var sList = tour[rid].players;
	tour.shuffle(sList);
	var key = 0;
	do
		{
			if (numByes > 0) {
				r.push([sList[key], undefined, sList[key]]);
				tour[rid].winners.push(sList[key]);
				numByes -= 1
				key++;
			}
		}
	while (numByes > 0);
	do
		{
			var match = new Array(); //[p1, p2, result]
			match.push(sList[key]);
			key++;
			match.push(sList[key]);
			key++;
			match.push(undefined);
			r.push(match);
		}
	while (key != sList.length);
	tour[rid].roundNum++;
	tour[rid].status = 2;
};
tour.nextRound = function(rid) {
	var w = tour[rid].winners;
	var l = tour[rid].losers;
	tour[rid].roundNum++;
	tour[rid].history.push(tour[rid].round);
	tour[rid].round = new Array();
	tour[rid].losers = new Array();
	tour[rid].winners = new Array();
	if (w.length == 1) {
		//end tour
		Rooms.rooms[rid].addRaw('<h2><font color="green">Congratulations <font color="black">' + w[0] + '</font>!  You have won the ' + tour[rid].tier + ' Tournament!</font></h2>' + '<br><font color="blue"><b>SECOND PLACE:</b></font> ' + l[0] + '<hr />');
		tour[rid].status = 0;
	}
	else {
		var html = '<hr /><h3><font color="green">Round '+ tour[rid].roundNum +'!</font></h3><font color="blue"><b>TIER:</b></font> ' + tour[rid].tier.toUpperCase() + "<hr /><center>";
		for (var i = 0; w.length / 2 > i; i++) {
			var p1 = i * 2;
			var p2 = p1 + 1;
			tour[rid].round.push([w[p1], w[p2], undefined]);
			html += w[p1] + " VS " + w[p2] + "<br />";
		}
		Rooms.rooms[rid].addRaw(html + "</center>");
	}
};
for (var i in Rooms.rooms) {
	if (Rooms.rooms[i].type == "chat" && !tour[i]) {
		tour[i] = new Object();
		tour.reset(i);
	}
}

var crypto = require('crypto');

var commands = exports.commands = {

	/*********************************************************
	 * Tournaments
	 *********************************************************/
	tour: function(target, room, user, connection) {
		if (!user.can('broadcast')) {
			return this.sendReply('You do not have enough authority to use this command.');
		}
		if (tour[room.id].status != 0) {
			return this.sendReply('There is already a tournament running, or there is one in a signup phase.');
		}
		if (!target) {
			return this.sendReply('Proper syntax for this command: /tour tier, size');
		}
		var targets = tour.splint(target);
		var tierMatch = false;
		var tempTourTier = '';
		for (var i = 0; i < tour.tiers.length; i++) {
			if ((targets[0].trim().toLowerCase()) == tour.tiers[i].trim().toLowerCase()) {
			tierMatch = true;
			tempTourTier = tour.tiers[i];
			}
		}
		if (!tierMatch) {
			return this.sendReply('Please use one of the following tiers: ' + tour.tiers.join(','));
		}
		targets[1] = parseInt(targets[1]);
		if (isNaN(targets[1])) {
			return this.sendReply('Proper syntax for this command: /tour tier, size');
		}
		if (targets[1] < 3) {
			return this.sendReply('Tournaments must contain 3 or more people.');
		}

		tour.reset(room.id);
		tour[room.id].tier = tempTourTier;
		tour[room.id].size = targets[1];
		tour[room.id].status = 1;
		tour[room.id].players = new Array();		

		room.addRaw('<hr /><h2><font color="green">' + sanitize(user.name) + ' has started a ' + tempTourTier + ' Tournament.</font> <font color="red">/j</font> <font color="green">to join!</font></h2><b><font color="blueviolet">PLAYERS:</font></b> ' + targets[1] + '<br /><font color="blue"><b>TIER:</b></font> ' + tempTourTier.toUpperCase() + '<hr />');
	},
	
	endtour: function(target, room, user, connection) {
		if (!user.can('broadcast')) {
			return this.sendReply('You do not have enough authority to use this command.');
		}
		if (tour[room.id].status == 0) {
			return this.sendReply('There is no active tournament.');
		}
		tour[room.id].status = 0;
		room.addRaw('<h2><b>' + user.name + '</b> has ended the tournament.</h2>');
	},
	
	toursize: function(target, room, user, connection) {
		if (!user.can('broadcast')) {
			return this.sendReply('You do not have enough authority to use this command.');
		}
		if (tour[room.id].status > 1) {
			return this.sendReply('The tournament size cannot be changed now!');
		}
		if (!target) {
			return this.sendReply('Proper syntax for this command: /toursize size');
		}
		target = parseInt(target);
		if (isNaN(target)) {
			return this.sendReply('Proper syntax for this command: /tour size');
		}
		if (target < 3) {
			return this.sendReply('A tournament must have at least 3 people in it.');
		}
		if (target < tour[room.id].players.length) {
			return this.sendReply('Target size must be greater than or equal to the amount of players in the tournament.');
		}
		tour[room.id].size = target;
		room.addRaw('<b>' + user.name + '</b> has changed the tournament size to: ' + target + '. <b><i>' + (target - tour[room.id].players.length) + ' slots remaining.</b></i>');
		if (target == tour[room.id].players.length) {
			tour.start(room.id);
			room.addRaw('<hr /><h3><font color="green">Round '+ tour[room.id].roundNum +'!</font></h3><font color="blue"><b>TIER:</b></font> ' + tour[room.id].tier.toUpperCase() + "<hr /><center>");
			var html = "";
			var round = tour[room.id].round;
			for (var i in round) {
				if (!round[i][1]) {
						html += "<font color=\"red\">" + round[i][0] + " has received a bye!</font><br />";
				}
				else {
					html += round[i][0] + " VS " + round[i][1] + "<br />";
				}
			}
			room.addRaw(html + "</center>");
		}
	},
	
	jt: 'j',
	jointour: 'j',
	j: function(target, room, user, connection) {
		if (tour[room.id].status == 0) {
			return this.sendReply('There is no active tournament to join.');
		}
		if (tour[room.id].status == 2) {
			return this.sendReply('Signups for the current tournament are over.');
		}
		if (tour.join(user.userid, room.id)) {
			room.addRaw('<b>' + user.name + '</b> has joined the tournament. <b><i>' + (tour[room.id].size - tour[room.id].players.length) + ' slots remaining.</b></i>');
			if (tour[room.id].size == tour[room.id].players.length) {
				tour.start(room.id);
				var html = '<hr /><h3><font color="green">Round '+ tour[room.id].roundNum +'!</font></h3><font color="blue"><b>TIER:</b></font> ' + tour[room.id].tier.toUpperCase() + "<hr /><center>";
				var round = tour[room.id].round;
				for (var i in round) {
					if (!round[i][1]) {
						html += "<font color=\"red\">" + round[i][0] + " has received a bye!</font><br />";
					}
					else {
						html += round[i][0] + " VS " + round[i][1] + "<br />";
					}
				}
				room.addRaw(html + "</center>");
			}
		} else {
			return this.sendReply('You could not enter the tournament. You may already be in the tournament. Type /l if you want to leave the tournament.');
		}
	},
	
	forcejoin: 'fj',
	fj: function(target, room, user, connection) {
		if (!user.can('broadcast')) {
			return this.sendReply('You do not have enough authority to use this command.');
		}
		if (tour[room.id].status == 0 || tour[room.id].status == 2) {
			return this.sendReply('There is no tournament in a sign-up phase.');
		}
		if (!target) {
			return this.sendReply('Please specify a user who you\'d like to participate.');
		}
		var targetUser = Users.get(target);
		if (targetUser) {
			target = targetUser.userid;
		}
		else {
			return this.sendReply('The user \'' + target + '\' doesn\'t exist.');
		}
		if (tour.join(target, room.id)) {
			room.addRaw(user.name + ' has forced <b>' + target + '</b> to join the tournament. <b><i>' + (tour[room.id].size - tour[room.id].players.length) + ' slots remaining.</b></i>');
			if (tour[room.id].size == tour[room.id].players.length) {
				tour.start(room.id);
				var html = '<hr /><h3><font color="green">Round '+ tour[room.id].roundNum +'!</font></h3><font color="blue"><b>TIER:</b></font> ' + tour[room.id].tier.toUpperCase() + "<hr /><center>";
				var round = tour[room.id].round;
				for (var i in round) {
					if (!round[i][1]) {
						html += "<font color=\"red\">" + round[i][0] + " has received a bye!</font><br />";
					}
					else {
						html += round[i][0] + " VS " + round[i][1] + "<br />";
					}
				}
				room.addRaw(html + "</center>");
			}
		}
		else {
			return this.sendReply('The user that you specified is already in the tournament.');
		}
	},
	
	lt: 'l',
	leavetour: 'l',
	l: function(target, room, user, connection) {
		if (tour[room.id].status == 0) {
			return this.sendReply('There is no active tournament to leave.');
		}
		var spotRemover = false;
		if (tour[room.id].status == 1) {
			if (tour.leave(user.userid, room.id)) {
				room.addRaw('<b>' + user.name + '</b> has left the tournament. <b><i>' + (tour[room.id].size - tour[room.id].players.length) + ' slots remaining.</b></i>');
			}
			else {
				return this.sendReply("You're not in the tournament.");
			}
		}
		else {
			var dqopp = tour.lose(user.userid, room.id);
			if (dqopp) {
				room.addRaw('<b>' + user.userid + '</b> has left the tournament. <b>' + dqopp + '</b> will advance.');
				var r = tour[room.id].round;
				var c = 0;
				for (var i in r) {
					if (r[i][2] && r[i][2] != -1) {
						c++;
					}
				}
				if (r.length == c) {
					tour.nextRound(room.id);
				}
			}
			else {
				return this.sendReply("You're not in the tournament or your opponent is unavailable.");
			}
		}
	},
	
	forceleave: 'fl',
	fl: function(target, room, user, connection) {
		if (!user.can('broadcast')) {
			return this.sendReply('You do not have enough authority to use this command.');
		}
		if (tour[room.id].status == 0 || tour[room.id].status == 2) {
			return this.sendReply('There is no tournament in a sign-up phase.  Use /dq username if you wish to remove someone in an active tournament.');
		}
		if (!target) {
			return this.sendReply('Please specify a user to kick from this signup.');
		}
		var targetUser = Users.get(target);
		if (targetUser) {
			target = targetUser.userid;
		}
		else {
			return this.sendReply('The user \'' + target + '\' doesn\'t exist.');
		}
		if (tour.leave(target, room.id)) {
			room.addRaw(user.name + ' has forced <b>' + target + '</b> to leave the tournament. <b><i>' + (tour[room.id].size - tour[room.id].players.length) + ' slots remaining.</b></i>');
		}
		else {
			return this.sendReply('The user that you specified is not in the tournament.');
		}
	},
	
	remind: function(target, room, user, connection) {
		if (!user.can('broadcast')) {
			return this.sendReply('You do not have enough authority to use this command.');
		}
		if (tour[room.id].status != 1) {
			return this.sendReply('There is no tournament in its sign up phase.');
		}
		room.addRaw('<hr /><h2><font color="green">Please sign up for the ' + tour[room.id].tier + ' Tournament.</font> <font color="red">/j</font> <font color="green">to join!</font></h2><b><font color="blueviolet">PLAYERS:</font></b> ' + tour[room.id].size + '<br /><font color="blue"><b>TIER:</b></font> ' + tour[room.id].tier.toUpperCase() + '<hr />');
	},
	
	viewround: 'vr',
	vr: function(target, room, user, connection) {
		if (!user.can('broadcast')) {
				return this.sendReply('You do not have enough authority to use this command.');
		}
		if (tour[room.id].status < 2) {
				return this.sendReply('There is no tournament out of its signup phase.');
		}
		var html = '<hr /><h3><font color="green">Round '+ tour[room.id].roundNum + '!</font></h3><font color="blue"><b>TIER:</b></font> ' + tour[room.id].tier.toUpperCase() + "<hr /><center><small>Red = lost, Green = won, Bold = battling</small><center>";
		var r = tour[room.id].round;
		for (var i in r) {
			if (!r[i][1]) {
				//bye
				html += "<font color=\"red\">" + r[i][0] + " has received a bye.</font><br />";
			}
			else {
				if (r[i][2] == undefined) {
					//haven't started
					html += r[i][0] + " VS " + r[i][1] + "<br />";
				}
				else if (r[i][2] == -1) {
					//currently battling
					html += "<b>" + r[i][0] + " VS " + r[i][1] + "</b><br />";
				}
				else {
					//match completed
					var p1 = "red";
					var p2 = "green";
					if (r[i][2] == r[i][0]) {
						p1 = "green";
						p2 = "red";
					}
					html += "<b><font color=\"" + p1 + "\">" + r[i][0] + "</font> VS <font color=\"" + p2 + "\">" + r[i][1] + "</font></b><br />";
				}
			}
		}
		room.addRaw(html + "</center>");
	},
	
	disqualify: 'dq',
	dq: function(target, room, user, connection) {
		if (!user.can('broadcast')) {
			return this.sendReply('You do not have enough authority to use this command.');
		}
		if (!target) {
			return this.sendReply('Proper syntax for this command is: /dq username');
		}
		if (tour[room.id].status < 2) {
			return this.sendReply('There is no tournament out of its sign up phase.');
		}
		var targetUser = Users.get(target);
		if (!targetUser) {
			var dqGuy = sanitize(target.toLowerCase());
		} else {
			var dqGuy = targetUser.userid;
		}
		var error = tour.lose(dqGuy, room.id);
		if (error == -1) {
			return this.sendReply('The user \'' + target + '\' was not in the tournament.');
		}
		else if (error == 0) {
			return this.sendReply('The user \'' + target + '\' was not assigned an opponent. Wait till next round to disqualify them.');
		}
		else if (error == 1) {
			return this.sendReply('The user \'' + target + '\' already played their battle. Wait till next round to disqualify them.');
		}
		else {
			room.addRaw('<b>' + dqGuy + '</b> was disqualified by ' + user.name + ' so ' + error + ' advances.');
			var r = tour[room.id].round;
			var c = 0;
			for (var i in r) {
				if (r[i][2] && r[i][2] != -1) {
					c++;
				}
			}
			if (r.length == c) {
				tour.nextRound(room.id);
			}
		}
	},
	
	replace: function(target, room, user, connection) {
		if (!user.can('broadcast')) {
			return this.sendReply('You do not have enough authority to use this command.');
		}
		if (tour[room.id].status != 2) {
			return this.sendReply('The tournament is currently in a sign-up phase or is not active, and replacing users only works mid-tournament.');
		}
		if (!target) {
			return this.sendReply('Proper syntax for this command is: /replace user1, user2.  User 2 will replace User 1 in the current tournament.');
		}
		var t = tour.splint(target);
		if (!t[1]) {
			return this.sendReply('Proper syntax for this command is: /replace user1, user2.  User 2 will replace User 1 in the current tournament.');
		}
		var userOne = Users.get(t[0]); 
		var userTwo = Users.get(t[1]);
		if (!userTwo) {
			return this.sendReply('Proper syntax for this command is: /replace user1, user2.  The user you specified to be placed in the tournament is not present!');
		} else {
			t[1] = userTwo.userid;
		}
		if (userOne) {
			t[0] = userOne.userid;
		}
		var rt = tour[room.id];
		var init1 = false;
		var init2 = false;
		var players = rt.players;
		//check if replacee in tour
		for (var i in players) {
			if (players[i] ==  t[0]) {
				init1 = true;
			}
		}
		//check if replacer in tour
		for (var i in players) {
			if (players[i] ==  t[1]) {
				init2 = true;
			}
		}
		if (!init1) {
			return this.sendReply(t[0]  + ' cannot be replaced by ' + t[1] + " because they are not in the tournament.");
		}
		if (init2) {
			return this.sendReply(t[1] + ' cannot replace ' + t[0] + ' because they are already in the tournament.');
		}
		var outof = ["players", "winners", "losers", "round"];
		for (var x in outof) {
			for (var y in rt[outof[x]]) {
				var c = rt[outof[x]][y];
				if (outof[x] == "round") {
					if (c[0] == t[0]) {
						c[0] = t[1];
					}
					if (c[1] == t[0]) {
						c[1] = t[1];
					}
					if (c[2] == t[0]) {
						c[2] = t[1];
					}
				}
				else {
					if (c == t[0]) {
						c = t[1];
					}
				}
			}
		}
		rt.history.push(t[0] + "->" + t[1]);
		room.addRaw('<b>' + t[0] +'</b> has left the tournament and is replaced by <b>' + t[1] + '</b>.');
	},
	version: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('Server version: <b>'+CommandParser.package.version+'</b> <small>(<a href="http://pokemonshowdown.com/versions#' + CommandParser.serverVersion + '" target="_blank">' + CommandParser.serverVersion.substr(0,10) + '</a>)</small>');
	},

	me: function(target, room, user, connection) {
		target = this.canTalk(target);
		if (!target) return;

		return '/me ' + target;
	},

	mee: function(target, room, user, connection) {
		target = this.canTalk(target);
		if (!target) return;

		return '/mee ' + target;
	},
	forum: 'forums',
forums: function(target, room, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>The Amethyst Forums:</b><br /> - <a href = "http://amethyst.webuda.com/forums/" target = _blank>Forums</a>');
                },
	rules: function(target, room, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b><font color="red" size = 5>The Amethyst Rules:</font></b><br /> - <a href = "https://dl.dropboxusercontent.com/u/165566535/Amethyst%20Rules.html" target = _blank>Server Rules</a><br /> - <a href = "https://dl.dropboxusercontent.com/u/165566535/amethystleaguerules.html">League Rules</a>');
                },
			
			marlon: function(target, room, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Marlon:</b><br />'+
                                'Type: Water<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Milotic<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/350.png"><br />' +
                                'Badge: Tidal Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/083_zps6aa5effc.png">');
                },
			anarky: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Elite Four Anarky:</b><br />'+
                                'Type: Water<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Gyarados<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/130.png"><br />' +
                                'Badge: Cascade Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/060_zps66636c1f.png">');
                },
               
        r12m: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der R12M:</b><br />'+
                                'Type: Normal<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Chansey<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/113.png"><br />' +
                                'Badge: Clear Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/S115_zpsc5c27be8.png">');
                },
                
	riles: 
		if(user.userid === 'riles'){ 
			user.avatar = 64; 
			delete Users.users['riley']; 
			user.forceRename('Riley', user.authenticated); 
		},
               
        bobbyv: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Bobby V:</b><br />'+
                                'Type: Steel<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Metagross<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/376.png"><br />' +
                                'Badge: Titanium Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/134_zpsf585594f.png">');
                },
               
        ewok: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Ewok:</b><br />'+
                                'Type: Fire<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Typhlosion<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/157.png"><br />' +
                                'Badge: Eruption Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/K146_zpsb8afafa3.png">');
                },
               
        delibird: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Delibird:</b><br />'+
                                'Type: Flying<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Delibird<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/225.png"><br />' +
                                'Badge: Beak Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/074_zps0f23d5ac.png">');
                },
			boss: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Boss:</b><br />'+
                                'Type: Fire<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Infernape<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/392.png"><br />' +
                                'Badge: Inferno Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/006_zps6f18aed3.png">');
                },
               
        n: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der N:</b><br />'+
                                'Type: Dragon<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Kyurem-Black<br />' +
                                '<img src="http://media.pldh.net/pokecons/646-black.png"><br />' +
                                'Badge: Draco Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/555Reshiram_zps4cfa3ecc.png">');
                },
               
        ross: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Elite Four R@ss:</b><br />'+
                                'Type: Bug<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Volcarona<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/637.png"><br />' +
                                'Badge: Buzz Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/144_zpsee9a00df.png">');
                },
               
        miner0: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Elite Four Miner0:</b><br />'+
                                'Type: Fire<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Darmanitan<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/555.png"><br />' +
                                'Badge: Eta Carinae Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/099_zps94a606e2.png">');
                },
        colonialmustang: 'mustang',
        mustang: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Mustang:</b><br />'+
                                'Type: Ground<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Nidoking<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/034.png"><br />' +
                                'Badge: Flame Alchemy Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/132_zpsb8a73a6e.png">');
                },
               
        kozman: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Elite Four Kozm@n:</b><br />'+
                                'Type: Fighting<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Mienshao<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/620.png"><br />' +
                                'Badge: Aikido Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/145_zps5de2fc9e.png">');
                },
        qseasons: 'seasons',   
        seasons: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('hurhurhur i dun have code for it anymore qq');
                },
               
        aaron: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Aaron:</b><br />'+
                                'Type: Bug<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Scizor<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/212.png"><br />' +
                                'Badge: Hive Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/061_zps01c1d2a3.png">');
                },
               
        bluejob: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der BlueJob:</b><br />'+
                                'Type: Psychic<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Starmie<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/121.png"><br />' +
                                'Badge: Cognate Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/2d0fgxx_zpsca0442cd.png">');
                },
               
        sbb: 'smash',
        smashbrosbrawl: 'smash',
        smash: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Smash:</b><br />'+
                                'Type: Steel<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Lucario<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/448.png"><br />' +
                                'Badge: Steel Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/065_zpsd830d811.png">');
                },
		 massman: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Massman:</b><br />'+
                                'Type: Ice<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Cloyster<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/091.png"><br />' +
                                'Badge: Glacier Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/094_zps0f297808.png">');
                },
               
        sam: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Sam:</b><br />'+
                                'Type: Grass<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Breloom<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/286.png"><br />' +
                                'Badge: Forest Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/500TsutajaSide_zpsb8d59e72.png">');
                },
        scizornician: 'pyro',  
        pyro: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Pyro:</b><br />'+
                                'Type: Ghost<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Gengar<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/094.png"><br />' +
                                'Badge: Poltergeist Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/094_zps992c377f.png">');
                },
               
        sweet: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Sweet:</b><br />'+
                                'Type: Poison<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Muk<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/089.png"><br />' +
                                'Badge: Pollution Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/089_zpsd3d163fc.png">');
                },
               
        sumbreon: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Elite Four SUmbreon :</b><br />'+
                                'Type: Dragon<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Latios<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/381.png"><br />' +
                                'Badge: Lore Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/119_zps2fc800a9.png">');
                },
 
        talon: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Talon:</b><br />'+
                                'Type: Dark<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Weavile<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/461.png"><br />' +
                                'Badge: Breaker Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/142_zpsea0762e7.png">');
                },
       
        brawl: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Brawl:</b><br />'+
                                'Type: Fighting<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Gallade<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/475.png"><br />' +
                                'Badge: Focus Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/091_zpsc55ac97a.png">');
                },
		cuddly: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Cuddly:</b><br />'+
                                'Type: Ghost<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Golurk<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/623.png"><br />' +
                                'Badge: Phantom Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/114_zps7313774a.png">');
                },
               
        eon: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Eon:</b><br />'+
                                'Type: Dragon<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Latios<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/381.png"><br />' +
                                'Badge: Rapier Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/130_zpsce775186.png">');
                },
       
        energ218: 'energ',
        enernub: 'energ',
        nubnub: 'energ,',
        energ: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der EnerG218:</b><br />'+
                                'Type: Bug<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Galvantula<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/596.png"><br />' +
                                'Badge: NubNub Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/103_zps3f304ae8.png">');
                },
               
        hope: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Hope:</b><br />'+
                                'Type: Normal<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Meloetta<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/648.png"><br />' +
                                'Badge: Hax Badge<br />' +
                                '<img src="http://i1228.photobucket.com/albums/ee449/JCKane/meloettab_zpse6f71e13.png">');
                },
               
        onlylove: 'love',      
        love: function(target, rom, user) {
                if (!this.canBroadcast()) return;
                this.sendReplyBox('<b>Information on Gym Le@der Love:</b><br />'+
                                'Type: Grass<br />' +
                                'Tier: Over Used (OU)<br />' +
                                '<a href="gymleadermustang.wix.com%2F-amethystleague%23!gym-leaders%2FaboutPage" target="_blank">Thread</a><br />' +
                                'Signature Pokemon: Roserade<br />' +
                                '<img src="http://www.poke-amph.com/black-white/sprites/small/407.png"><br />' +
                                'Badge: Growth Badge<br />' +
                                '<img src="http://i1305.photobucket.com/albums/s542/TheBattleTowerPS/K003_zps16041652.png">');
                },
		
		pet: function(target, room, user) {
        if (!target) {
                return this.sendReply('Please specify a user who you\'d like to pet.');
        }
        var targetUser = Users.get(target);
        if (targetUser) {
                target = targetUser.userid;
                }
        else {
                return this.sendReply('The user \'' + target + '\' doesn\'t exist.');
        }
        this.add(user.name + ' pet ' + targetUser.name + '.');
        },
		gymleaders: 'leaders',
        leaders: function(target, room, user) {
                if(!this.canBroadcast()) return;
                this.sendReplyBox('<b>List of Active Gym Leaders:</b>' +
                '<ul><li>Gym Le@der Smash (SmashBrosBrawl): Steel</li><li>Gym Le@der Ewok: Fire</li><li>Gym Le@der Boss: Fire</li><li>Gym Le@der Talon: Dark</li><li>Gym Le@der Sam: Grass</li><li>Gym Le@der Love (OnlyLove): Grass</li><li>Gym Le@der Nord: Ice</li><li>Gym Le@der Massman: Ice</li><li>Gym Le@der 9 (ModernWolf, SeleÃ§Ã£o #9): Rock</li><li>Gym Le@der Volkner: Electric</li><li>Gym Le@der Pyro (Scizornician): Ghost</li><li>Gym Le@der Cuddly: Ghost</li><li>Gym Le@der Delibird: Flying</li><li>Gym Le@der Sweet: Poison</li><li>Gym Le@der Mustang: Ground</li><li>Gym Le@der Topazio: Ground</li><li>Gym Le@der BlueJob: Psychic</li><li>Gym Le@der Marlon: Water</li><li>Gym Le@der Brawl: Fighting</li><li>Gym Le@der EnerG218: Bug</li><li>Gym Le@der Hope: Normal</li><li>Gym Le@der N: Dragon</li><li>Gym Le@der Eon: Dragon</li></ul>We currently have no need for any more gym leaders.');
        },
 
        pika: 'chuuu',
        chuuu: function(target, room, user) {
        if(!this.canBroadcast()) return;
        this.sendReplyBox('<b>These infoboxes were made by piiiikachuuu</b><br />'+
                'pm him if you need something to be changed or if you\'re a new gym leader/elite four and you need one.<br />'+
                                '<img src="http://i1073.photobucket.com/albums/w394/HeechulBread/Pikachu_sprite_by_Momogirl_zpsf31aafb5.gif">');
                },

	

	avatar: function(target, room, user) {
		if (!target) return this.parse('/avatars');
		var parts = target.split(',');
		var avatar = parseInt(parts[0]);
		if (!avatar || avatar > 294 || avatar < 1) {
			if (!parts[1]) {
				this.sendReply("Invalid avatar.");
			}
			return false;
		}

		user.avatar = avatar;
		if (!parts[1]) {
			this.sendReply("Avatar changed to:\n" +
					'|raw|<img src="//play.pokemonshowdown.com/sprites/trainers/'+avatar+'.png" alt="" width="80" height="80" />');
		}
	},

	logout: function(target, room, user) {
		user.resetName();
	},

	r: 'reply',
	reply: function(target, room, user) {
		if (!target) return this.parse('/help reply');
		if (!user.lastPM) {
			return this.sendReply('No one has PMed you yet.');
		}
		return this.parse('/msg '+(user.lastPM||'')+', '+target);
	},

	pm: 'msg',
	whisper: 'msg',
	w: 'msg',
	msg: function(target, room, user) {
		if (!target) return this.parse('/help msg');
		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!target) {
			this.sendReply('You forgot the comma.');
			return this.parse('/help msg');
		}
		if (!targetUser || !targetUser.connected) {
			if (!target) {
				this.sendReply('User '+this.targetUsername+' not found. Did you forget a comma?');
			} else {
				this.sendReply('User '+this.targetUsername+' not found. Did you misspell their name?');
			}
			return this.parse('/help msg');
		}

		if (user.locked && !targetUser.can('lock', user)) {
			return this.popupReply('You can only private message members of the moderation team (users marked by %, @, &, or ~) when locked.');
		}
		if (targetUser.locked && !user.can('lock', targetUser)) {
			return this.popupReply('This user is locked and cannot PM.');
		}

		if (!user.named) {
			return this.popupReply('You must choose a name before you can send private messages.');
		}

		var message = '|pm|'+user.getIdentity()+'|'+targetUser.getIdentity()+'|'+target;
		user.send(message);
		if (targetUser !== user) targetUser.send(message);
		targetUser.lastPM = user.userid;
		user.lastPM = targetUser.userid;
	},

	makechatroom: function(target, room, user) {
		if (!this.can('makeroom')) return;
		var id = toId(target);
		if (Rooms.rooms[id]) {
			return this.sendReply("The room '"+target+"' already exists.");
		}
		Rooms.rooms[id] = new Rooms.ChatRoom(id, target);
		tour.reset(target);
		return this.sendReply("The room '"+target+"' was created.");
	},

	privateroom: function(target, room, user) {
		if (!this.can('makeroom')) return;
		if (target === 'off') {
			room.isPrivate = false;
			this.addModCommand(user.name+' made the room public.');
		} else {
			room.isPrivate = true;
			this.addModCommand(user.name+' made the room private.');
		}
	},

	join: function(target, room, user, connection) {
		var targetRoom = Rooms.get(target);
		if (target && !targetRoom) {
			return connection.sendTo(target, "|noinit|nonexistent|The room '"+target+"' does not exist.");
		}
		if (targetRoom && !targetRoom.battle && targetRoom !== Rooms.lobby && !user.named) {
			return connection.sendTo(target, "|noinit|namerequired|You must have a name in order to join the room '"+target+"'.");
		}
		if (!user.joinRoom(targetRoom || room, connection)) {
			// This condition appears to be impossible for now.
			return connection.sendTo(target, "|noinit|joinfailed|The room '"+target+"' could not be joined.");
		}
	},

	leave: 'part',
	part: function(target, room, user, connection) {
		if (room.id === 'global') return false;
		var targetRoom = Rooms.get(target);
		if (target && !targetRoom) {
			return this.sendReply("The room '"+target+"' does not exist.");
		}
		user.leaveRoom(targetRoom || room, connection);
	},

	/*********************************************************
	 * Moderating: Punishments
	 *********************************************************/

	kick: 'warn',
	k: 'warn',
	warn: function(target, room, user) {
		if (!target) return this.parse('/help warn');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('warn', targetUser)) return false;

		this.addModCommand(''+targetUser.name+' was warned by '+user.name+'.' + (target ? " (" + target + ")" : ""));
		targetUser.send('|c|~|/warn '+target);
	},

	m: 'mute',
	mute: function(target, room, user) {
		if (!target) return this.parse('/help mute');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('mute', targetUser)) return false;
		if (targetUser.mutedRooms[room.id] || targetUser.locked || !targetUser.connected) {
			var problem = ' but was already '+(!targetUser.connected ? 'offline' : targetUser.locked ? 'locked' : 'muted');
			if (!target) {
				return this.privateModCommand('('+targetUser.name+' would be muted by '+user.name+problem+'.)');
			}
			return this.addModCommand(''+targetUser.name+' would be muted by '+user.name+problem+'.' + (target ? " (" + target + ")" : ""));
		}

		targetUser.popup(user.name+' has muted you for 7 minutes. '+target);
		this.addModCommand(''+targetUser.name+' was muted by '+user.name+' for 7 minutes.' + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) this.addModCommand(""+targetUser.name+"'s alts were also muted: "+alts.join(", "));

		targetUser.mute(room.id, 7*60*1000);
	},

	hourmute: function(target, room, user) {
		if (!target) return this.parse('/help hourmute');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('mute', targetUser)) return false;

		if (((targetUser.mutedRooms[room.id] && (targetUser.muteDuration[room.id]||0) >= 50*60*1000) || targetUser.locked) && !target) {
			var problem = ' but was already '+(!targetUser.connected ? 'offline' : targetUser.locked ? 'locked' : 'muted');
			return this.privateModCommand('('+targetUser.name+' would be muted by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+' has muted you for 60 minutes. '+target);
		this.addModCommand(''+targetUser.name+' was muted by '+user.name+' for 60 minutes.' + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) this.addModCommand(""+targetUser.name+"'s alts were also muted: "+alts.join(", "));

		targetUser.mute(room.id, 60*60*1000, true);
	},

	um: 'unmute',
	unmute: function(target, room, user) {
		if (!target) return this.parse('/help something');
		var targetid = toUserid(target);
		var targetUser = Users.get(target);
		if (!targetUser) {
			return this.sendReply('User '+target+' not found.');
		}
		if (!this.can('mute', targetUser)) return false;

		if (!targetUser.mutedRooms[room.id]) {
			return this.sendReply(''+targetUser.name+' isn\'t muted.');
		}

		this.addModCommand(''+targetUser.name+' was unmuted by '+user.name+'.');

		targetUser.unmute(room.id);
	},

	ipmute: 'lock',
	lock: function(target, room, user) {
		if (!target) return this.parse('/help lock');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUser+' not found.');
		}
		if (!user.can('lock', targetUser)) {
			return this.sendReply('/lock - Access denied.');
		}

		if ((targetUser.locked || Users.checkBanned(Object.keys(targetUser.ips)[0])) && !target) {
			var problem = ' but was already '+(targetUser.locked ? 'locked' : 'banned');
			return this.privateModCommand('('+targetUser.name+' would be locked by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+' has locked you from talking in chats, battles, and PMing regular users.\n\n'+target+'\n\nIf you feel that your lock was unjustified, you can still PM staff members (%, @, &, and ~) to discuss it.');

		this.addModCommand(""+targetUser.name+" was locked from talking by "+user.name+"." + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) this.addModCommand(""+targetUser.name+"'s alts were also locked: "+alts.join(", "));

		targetUser.lock();
	},

	unlock: function(target, room, user) {
		if (!target) return this.parse('/help unlock');
		if (!this.can('lock')) return false;

		var unlocked = Users.unlock(target);

		if (unlocked) {
			var names = Object.keys(unlocked);
			this.addModCommand('' + names.join(', ') + ' ' +
					((names.length > 1) ? 'were' : 'was') +
					' unlocked by ' + user.name + '.');
		} else {
			this.sendReply('User '+target+' is not locked.');
		}
	},

	b: 'ban',
	ban: function(target, room, user) {
		if (!target) return this.parse('/help ban');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('ban', targetUser)) return false;

		if (Users.checkBanned(Object.keys(targetUser.ips)[0]) && !target) {
			var problem = ' but was already banned';
			return this.privateModCommand('('+targetUser.name+' would be banned by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+" has banned you.  If you feel that your banning was unjustified you can appeal the ban:\nhttp://www.smogon.com/forums/announcement.php?f=126&a=204\n\n"+target);

		this.addModCommand(""+targetUser.name+" was banned by "+user.name+"." + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) this.addModCommand(""+targetUser.name+"'s alts were also banned: "+alts.join(", "));

		targetUser.ban();
	},

	unban: function(target, room, user) {
		if (!target) return this.parse('/help unban');
		if (!user.can('ban')) {
			return this.sendReply('/unban - Access denied.');
		}

		var name = Users.unban(target);

		if (name) {
			this.addModCommand(''+name+' was unbanned by '+user.name+'.');
		} else {
			this.sendReply('User '+target+' is not banned.');
		}
	},

	unbanall: function(target, room, user) {
		if (!user.can('ban')) {
			return this.sendReply('/unbanall - Access denied.');
		}
		// we have to do this the hard way since it's no longer a global
		for (var i in Users.bannedIps) {
			delete Users.bannedIps[i];
		}
		for (var i in Users.lockedIps) {
			delete Users.lockedIps[i];
		}
		this.addModCommand('All bans and locks have been lifted by '+user.name+'.');
	},

	banip: function(target, room, user) {
		target = target.trim();
		if (!target) {
			return this.parse('/help banip');
		}
		if (!this.can('rangeban')) return false;

		Users.bannedIps[target] = '#ipban';
		this.addModCommand(user.name+' temporarily banned the '+(target.charAt(target.length-1)==='*'?'IP range':'IP')+': '+target);
	},

	unbanip: function(target, room, user) {
		target = target.trim();
		if (!target) {
			return this.parse('/help unbanip');
		}
		if (!this.can('rangeban')) return false;
		if (!Users.bannedIps[target]) {
			return this.sendReply(''+target+' is not a banned IP or IP range.');
		}
		delete Users.bannedIps[target];
		this.addModCommand(user.name+' unbanned the '+(target.charAt(target.length-1)==='*'?'IP range':'IP')+': '+target);
	},

	/*********************************************************
	 * Moderating: Other
	 *********************************************************/

	demote: 'promote',
	promote: function(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help promote');
		var target = this.splitTarget(target, true);
		var targetUser = this.targetUser;
		var userid = toUserid(this.targetUsername);
		var name = targetUser ? targetUser.name : this.targetUsername;

		var currentGroup = ' ';
		if (targetUser) {
			currentGroup = targetUser.group;
		} else if (Users.usergroups[userid]) {
			currentGroup = Users.usergroups[userid].substr(0,1);
		}

		var nextGroup = target ? target : Users.getNextGroupSymbol(currentGroup, cmd === 'demote');
		if (target === 'deauth') nextGroup = config.groupsranking[0];
		if (!config.groups[nextGroup]) {
			return this.sendReply('Group \'' + nextGroup + '\' does not exist.');
		}
		if (!user.checkPromotePermission(currentGroup, nextGroup)) {
			return this.sendReply('/promote - Access denied.');
		}

		var isDemotion = (config.groups[nextGroup].rank < config.groups[currentGroup].rank);
		if (!Users.setOfflineGroup(name, nextGroup)) {
			return this.sendReply('/promote - WARNING: This user is offline and could be unregistered. Use /forcepromote if you\'re sure you want to risk it.');
		}
		var groupName = (config.groups[nextGroup].name || nextGroup || '').trim() || 'a regular user';
		if (isDemotion) {
			this.privateModCommand('('+name+' was demoted to ' + groupName + ' by '+user.name+'.)');
			if (targetUser) {
				targetUser.popup('You were demoted to ' + groupName + ' by ' + user.name + '.');
			}
		} else {
			this.addModCommand(''+name+' was promoted to ' + groupName + ' by '+user.name+'.');
		}
		if (targetUser) {
			targetUser.updateIdentity();
		}
	},

	forcepromote: function(target, room, user) {
		// warning: never document this command in /help
		if (!this.can('forcepromote')) return false;
		var target = this.splitTarget(target, true);
		var name = this.targetUsername;
		var nextGroup = target ? target : Users.getNextGroupSymbol(' ', false);

		if (!Users.setOfflineGroup(name, nextGroup, true)) {
			return this.sendReply('/forcepromote - Don\'t forcepromote unless you have to.');
		}
		var groupName = config.groups[nextGroup].name || nextGroup || '';
		this.addModCommand(''+name+' was promoted to ' + (groupName.trim()) + ' by '+user.name+'.');
	},

	deauth: function(target, room, user) {
		return this.parse('/demote '+target+', deauth');
	},

	modchat: function(target, room, user) {
		if (!target) {
			return this.sendReply('Moderated chat is currently set to: '+config.modchat);
		}
		if (!this.can('modchat') || !this.canTalk()) return false;

		target = target.toLowerCase();
		switch (target) {
		case 'on':
		case 'true':
		case 'yes':
		case 'registered':
			this.sendReply("Modchat registered has been removed.");
			this.sendReply("If you're dealing with a spammer, make sure to run /loadbanlist.");
			return false;
			break;
		case 'off':
		case 'false':
		case 'no':
			config.modchat = false;
			break;
		default:
			if (!config.groups[target]) {
				return this.parse('/help modchat');
			}
			if (config.groupsranking.indexOf(target) > 1 && !user.can('modchatall')) {
				return this.sendReply('/modchat - Access denied for setting higher than ' + config.groupsranking[1] + '.');
			}
			config.modchat = target;
			break;
		}
		if (config.modchat === true) {
			this.add('|raw|<div class="broadcast-red"><b>Moderated chat was enabled!</b><br />Only registered users can talk.</div>');
		} else if (!config.modchat) {
			this.add('|raw|<div class="broadcast-blue"><b>Moderated chat was disabled!</b><br />Anyone may talk now.</div>');
		} else {
			var modchat = sanitize(config.modchat);
			this.add('|raw|<div class="broadcast-red"><b>Moderated chat was set to '+modchat+'!</b><br />Only users of rank '+modchat+' and higher can talk.</div>');
		}
		this.logModCommand(user.name+' set modchat to '+config.modchat);
	},

	declare: function(target, room, user) {
		if (!target) return this.parse('/help declare');
		if (!this.can('declare')) return false;

		if (!this.canTalk()) return;

		this.add('|raw|<div class="broadcast-blue"><b>'+target+'</b></div>');
		this.logModCommand(user.name+' declared '+target);
	},

	wall: 'announce',
	announce: function(target, room, user) {
		if (!target) return this.parse('/help announce');
		if (!this.can('announce')) return false;

		target = this.canTalk(target);
		if (!target) return;

		return '/announce '+target;
	},

	fr: 'forcerename',
	forcerename: function(target, room, user) {
		if (!target) return this.parse('/help forcerename');
		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('forcerename', targetUser)) return false;

		if (targetUser.userid === toUserid(this.targetUser)) {
			var entry = ''+targetUser.name+' was forced to choose a new name by '+user.name+'.' + (target ? " (" + target + ")" : "");
			this.logModCommand(entry);
			Rooms.lobby.sendAuth(entry);
			if (room.id !== 'lobby') {
				this.add(entry);
			} else {
				this.logEntry(entry);
			}
			targetUser.resetName();
			targetUser.send('|nametaken||'+user.name+" has forced you to change your name. "+target);
		} else {
			this.sendReply("User "+targetUser.name+" is no longer using that name.");
		}
	},

	frt: 'forcerenameto',
	forcerenameto: function(target, room, user) {
		if (!target) return this.parse('/help forcerenameto');
		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!target) {
			return this.sendReply('No new name was specified.');
		}
		if (!this.can('forcerenameto', targetUser)) return false;

		if (targetUser.userid === toUserid(this.targetUser)) {
			var entry = ''+targetUser.name+' was forcibly renamed to '+target+' by '+user.name+'.';
			this.logModCommand(entry);
			Rooms.lobby.sendAuth(entry);
			if (room.id !== 'lobby') {
				room.add(entry);
			} else {
				room.logEntry(entry);
			}
			targetUser.forceRename(target);
		} else {
			this.sendReply("User "+targetUser.name+" is no longer using that name.");
		}
	},

	modlog: function(target, room, user, connection) {
		if (!this.can('modlog')) return false;
		var lines = 0;
		if (!target.match('[^0-9]')) { 
			lines = parseInt(target || 15, 10);
			if (lines > 100) lines = 100;
		}
		var filename = 'logs/modlog.txt';
		var command = 'tail -'+lines+' '+filename;
		var grepLimit = 100;
		if (!lines || lines < 0) { // searching for a word instead
			if (target.match(/^["'].+["']$/)) target = target.substring(1,target.length-1);
			command = "awk '{print NR,$0}' "+filename+" | sort -nr | cut -d' ' -f2- | grep -m"+grepLimit+" -i '"+target.replace(/\\/g,'\\\\\\\\').replace(/["'`]/g,'\'\\$&\'').replace(/[\{\}\[\]\(\)\$\^\.\?\+\-\*]/g,'[$&]')+"'";
		}

		require('child_process').exec(command, function(error, stdout, stderr) {
			if (error && stderr) {
				connection.popup('/modlog erred - modlog does not support Windows');
				console.log('/modlog error: '+error);
				return false;
			}
			if (lines) {
				if (!stdout) {
					connection.popup('The modlog is empty. (Weird.)');
				} else {
					connection.popup('Displaying the last '+lines+' lines of the Moderator Log:\n\n'+stdout);
				}
			} else {
				if (!stdout) {
					connection.popup('No moderator actions containing "'+target+'" were found.');
				} else {
					connection.popup('Displaying the last '+grepLimit+' logged actions containing "'+target+'":\n\n'+stdout);
				}
			}
		});
	},

	bw: 'banword',
	banword: function(target, room, user) {
		if (!this.can('declare')) return false;
		target = toId(target);
		if (!target) {
			return this.sendReply('Specify a word or phrase to ban.');
		}
		Users.addBannedWord(target);
		this.sendReply('Added \"'+target+'\" to the list of banned words.');
	},

	ubw: 'unbanword',
	unbanword: function(target, room, user) {
		if (!this.can('declare')) return false;
		target = toId(target);
		if (!target) {
			return this.sendReply('Specify a word or phrase to unban.');
		}
		Users.removeBannedWord(target);
		this.sendReply('Removed \"'+target+'\" from the list of banned words.');
	},

	/*********************************************************
	 * Server management commands
	 *********************************************************/

	hotpatch: function(target, room, user) {
		if (!target) return this.parse('/help hotpatch');
		if (!this.can('hotpatch')) return false;

		if (target === 'chat') {

			CommandParser.uncacheTree('./command-parser.js');
			CommandParser = require('./command-parser.js');
			return this.sendReply('Chat commands have been hot-patched.');

		} else if (target === 'battles') {

			Simulator.SimulatorProcess.respawn();
			return this.sendReply('Battles have been hotpatched. Any battles started after now will use the new code; however, in-progress battles will continue to use the old code.');

		} else if (target === 'formats') {

			// uncache the tools.js dependency tree
			CommandParser.uncacheTree('./tools.js');
			// reload tools.js
			Data = {};	
			Tools = require('./tools.js'); // note: this will lock up the server for a few seconds
			// rebuild the formats list
			Rooms.global.formatListText = Rooms.global.getFormatListText();
			// respawn simulator processes
			Simulator.SimulatorProcess.respawn();
			// broadcast the new formats list to clients
			Rooms.global.send(Rooms.global.formatListText);

			return this.sendReply('Formats have been hotpatched.');

		}
		this.sendReply('Your hot-patch command was unrecognized.');
	},

	savelearnsets: function(target, room, user) {
		if (this.can('hotpatch')) return false;
		fs.writeFile('data/learnsets.js', 'exports.BattleLearnsets = '+JSON.stringify(BattleLearnsets)+";\n");
		this.sendReply('learnsets.js saved.');
	},

	disableladder: function(target, room, user) {
		if (!this.can('disableladder')) return false;
		if (LoginServer.disabled) {
			return this.sendReply('/disableladder - Ladder is already disabled.');
		}
		LoginServer.disabled = true;
		this.logModCommand('The ladder was disabled by ' + user.name + '.');
		this.add('|raw|<div class="broadcast-red"><b>Due to high server load, the ladder has been temporarily disabled</b><br />Rated games will no longer update the ladder. It will be back momentarily.</div>');
	},

	enableladder: function(target, room, user) {
		if (!this.can('disableladder')) return false;
		if (!LoginServer.disabled) {
			return this.sendReply('/enable - Ladder is already enabled.');
		}
		LoginServer.disabled = false;
		this.logModCommand('The ladder was enabled by ' + user.name + '.');
		this.add('|raw|<div class="broadcast-green"><b>The ladder is now back.</b><br />Rated games will update the ladder now.</div>');
	},

	lockdown: function(target, room, user) {
		if (!this.can('lockdown')) return false;

		lockdown = true;
		for (var id in Rooms.rooms) {
			if (id !== 'global') Rooms.rooms[id].addRaw('<div class="broadcast-red"><b>The server is restarting soon.</b><br />Please finish your battles quickly. No new battles can be started until the server resets in a few minutes.</div>');
			if (Rooms.rooms[id].requestKickInactive) Rooms.rooms[id].requestKickInactive(user, true);
		}

		Rooms.lobby.logEntry(user.name + ' used /lockdown');

	},

	endlockdown: function(target, room, user) {
		if (!this.can('lockdown')) return false;

		lockdown = false;
		for (var id in Rooms.rooms) {
			if (id !== 'global') Rooms.rooms[id].addRaw('<div class="broadcast-green"><b>The server shutdown was canceled.</b></div>');
		}

		Rooms.lobby.logEntry(user.name + ' used /endlockdown');

	},

	kill: function(target, room, user) {
		if (!this.can('lockdown')) return false;

		if (!lockdown) {
			return this.sendReply('For safety reasons, /kill can only be used during lockdown.');
		}

		if (CommandParser.updateServerLock) {
			return this.sendReply('Wait for /updateserver to finish before using /kill.');
		}

		Rooms.lobby.destroyLog(function() {
			Rooms.lobby.logEntry(user.name + ' used /kill');
		}, function() {
			process.exit();
		});

		// Just in the case the above never terminates, kill the process
		// after 10 seconds.
		setTimeout(function() {
			process.exit();
		}, 10000);
	},

	loadbanlist: function(target, room, user, connection) {
		if (!this.can('modchat')) return false;

		connection.sendTo(room, 'Loading ipbans.txt...');
		fs.readFile('config/ipbans.txt', function (err, data) {
			if (err) return;
			data = (''+data).split("\n");
			var count = 0;
			for (var i=0; i<data.length; i++) {
				if (data[i] && !Users.bannedIps[data[i]]) {
					Users.bannedIps[data[i]] = '#ipban';
					count++;
				}
			}
			if (!count) {
				connection.sendTo(room, 'No IPs were banned; ipbans.txt has not been updated since the last time /loadbanlist was called.');
			} else {
				connection.sendTo(room, ''+count+' IPs were loaded from ipbans.txt and banned.');
			}
		});
	},

	refreshpage: function(target, room, user) {
		if (!this.can('hotpatch')) return false;
		Rooms.lobby.send('|refresh|');
		Rooms.lobby.logEntry(user.name + ' used /refreshpage');
	},

	updateserver: function(target, room, user, connection) {
		if (!user.checkConsolePermission(connection.socket)) {
			return this.sendReply('/updateserver - Access denied.');
		}

		if (CommandParser.updateServerLock) {
			return this.sendReply('/updateserver - Another update is already in progress.');
		}

		CommandParser.updateServerLock = true;

		var logQueue = [];
		logQueue.push(user.name + ' used /updateserver');

		connection.sendTo(room, 'updating...');

		var exec = require('child_process').exec;
		exec('git diff-index --quiet HEAD --', function(error) {
			var cmd = 'git pull --rebase';
			if (error) {
				if (error.code === 1) {
					// The working directory or index have local changes.
					cmd = 'git stash;' + cmd + ';git stash pop';
				} else {
					// The most likely case here is that the user does not have
					// `git` on the PATH (which would be error.code === 127).
					connection.sendTo(room, '' + error);
					logQueue.push('' + error);
					logQueue.forEach(Rooms.lobby.logEntry.bind(Rooms.lobby));
					CommandParser.updateServerLock = false;
					return;
				}
			}
			var entry = 'Running `' + cmd + '`';
			connection.sendTo(room, entry);
			logQueue.push(entry);
			exec(cmd, function(error, stdout, stderr) {
				('' + stdout + stderr).split('\n').forEach(function(s) {
					connection.sendTo(room, s);
					logQueue.push(s);
				});
				logQueue.forEach(Rooms.lobby.logEntry.bind(Rooms.lobby));
				CommandParser.updateServerLock = false;
			});
		});
	},

	crashfixed: function(target, room, user) {
		if (!lockdown) {
			return this.sendReply('/crashfixed - There is no active crash.');
		}
		if (!this.can('hotpatch')) return false;

		lockdown = false;
		config.modchat = false;
		Rooms.lobby.addRaw('<div class="broadcast-green"><b>We fixed the crash without restarting the server!</b><br />You may resume talking in the lobby and starting new battles.</div>');
		Rooms.lobby.logEntry(user.name + ' used /crashfixed');
	},

	crashlogged: function(target, room, user) {
		if (!lockdown) {
			return this.sendReply('/crashlogged - There is no active crash.');
		}
		if (!this.can('declare')) return false;

		lockdown = false;
		config.modchat = false;
		Rooms.lobby.addRaw('<div class="broadcast-green"><b>We have logged the crash and are working on fixing it!</b><br />You may resume talking in the lobby and starting new battles.</div>');
		Rooms.lobby.logEntry(user.name + ' used /crashlogged');
	},

	eval: function(target, room, user, connection, cmd, message) {
		if (!user.checkConsolePermission(connection.socket)) {
			return this.sendReply("/eval - Access denied.");
		}
		if (!this.canBroadcast()) return;

		if (!this.broadcasting) this.sendReply('||>> '+target);
		try {
			var battle = room.battle;
			var me = user;
			this.sendReply('||<< '+eval(target));
		} catch (e) {
			this.sendReply('||<< error: '+e.message);
			var stack = '||'+(''+e.stack).replace(/\n/g,'\n||');
			connection.sendTo(room, stack);
		}
	},

	evalbattle: function(target, room, user, connection, cmd, message) {
		if (!user.checkConsolePermission(connection.socket)) {
			return this.sendReply("/evalbattle - Access denied.");
		}
		if (!this.canBroadcast()) return;
		if (!room.battle) {
			return this.sendReply("/evalbattle - This isn't a battle room.");
		}

		room.battle.send('eval', target.replace(/\n/g, '\f'));
	},

	/*********************************************************
	 * Battle commands
	 *********************************************************/

	concede: 'forfeit',
	surrender: 'forfeit',
	forfeit: function(target, room, user) {
		if (!room.battle) {
			return this.sendReply("There's nothing to forfeit here.");
		}
		if (!room.forfeit(user)) {
			return this.sendReply("You can't forfeit this battle.");
		}
	},

	savereplay: function(target, room, user, connection) {
		if (!room || !room.battle) return;
		var logidx = 2; // spectator log (no exact HP)
		if (room.battle.ended) {
			// If the battle is finished when /savereplay is used, include
			// exact HP in the replay log.
			logidx = 3;
		}
		var data = room.getLog(logidx).join("\n");
		var datahash = crypto.createHash('md5').update(data.replace(/[^(\x20-\x7F)]+/g,'')).digest('hex');

		LoginServer.request('prepreplay', {
			id: room.id.substr(7),
			loghash: datahash,
			p1: room.p1.name,
			p2: room.p2.name,
			format: room.format
		}, function(success) {
			connection.send('|queryresponse|savereplay|'+JSON.stringify({
				log: data,
				room: 'lobby',
				id: room.id.substr(7)
			}));
		});
	},

	mv: 'move',
	attack: 'move',
	move: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'choose', 'move '+target);
	},

	sw: 'switch',
	switch: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'choose', 'switch '+parseInt(target,10));
	},

	choose: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'choose', target);
	},

	undo: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'undo', target);
	},

	team: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'choose', 'team '+target);
	},

	joinbattle: function(target, room, user) {
		if (!room.joinBattle) return this.sendReply('You can only do this in battle rooms.');

		room.joinBattle(user);
	},

	partbattle: 'leavebattle',
	leavebattle: function(target, room, user) {
		if (!room.leaveBattle) return this.sendReply('You can only do this in battle rooms.');

		room.leaveBattle(user);
	},

	kickbattle: function(target, room, user) {
		if (!room.leaveBattle) return this.sendReply('You can only do this in battle rooms.');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('kick', targetUser)) return false;

		if (room.leaveBattle(targetUser)) {
			this.addModCommand(''+targetUser.name+' was kicked from a battle by '+user.name+'' + (target ? " (" + target + ")" : ""));
		} else {
			this.sendReply("/kickbattle - User isn\'t in battle.");
		}
	},

	kickinactive: function(target, room, user) {
		if (room.requestKickInactive) {
			room.requestKickInactive(user);
		} else {
			this.sendReply('You can only kick inactive players from inside a room.');
		}
	},

	timer: function(target, room, user) {
		target = toId(target);
		if (room.requestKickInactive) {
			if (target === 'off' || target === 'stop') {
				room.stopKickInactive(user, user.can('timer'));
			} else if (target === 'on' || !target) {
				room.requestKickInactive(user, user.can('timer'));
			} else {
				this.sendReply("'"+target+"' is not a recognized timer state.");
			}
		} else {
			this.sendReply('You can only set the timer from inside a room.');
		}
	},

	forcetie: 'forcewin',
	forcewin: function(target, room, user) {
		if (!this.can('forcewin')) return false;
		if (!room.battle) {
			this.sendReply('/forcewin - This is not a battle room.');
		}

		room.battle.endType = 'forced';
		if (!target) {
			room.battle.tie();
			this.logModCommand(user.name+' forced a tie.');
			return false;
		}
		target = Users.get(target);
		if (target) target = target.userid;
		else target = '';

		if (target) {
			room.battle.win(target);
			this.logModCommand(user.name+' forced a win for '+target+'.');
		}

	},

	/*********************************************************
	 * Challenging and searching commands
	 *********************************************************/

	cancelsearch: 'search',
	search: function(target, room, user) {
		if (target) {
			Rooms.global.searchBattle(user, target);
		} else {
			Rooms.global.cancelSearch(user);
		}
	},

	chall: 'challenge',
	challenge: function(target, room, user) {
		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.popupReply("The user '"+this.targetUsername+"' was not found.");
		}
		if (targetUser.blockChallenges && !user.can('bypassblocks', targetUser)) {
			return this.popupReply("The user '"+this.targetUsername+"' is not accepting challenges right now.");
		}
		if (typeof target !== 'string') target = 'customgame';
		var problems = Tools.validateTeam(user.team, target);
		if (problems) {
			return this.popupReply("Your team was rejected for the following reasons:\n\n- "+problems.join("\n- "));
		}
		user.makeChallenge(targetUser, target);
	},

	away: 'blockchallenges',
	idle: 'blockchallenges',
	blockchallenges: function(target, room, user) {
		user.blockChallenges = true;
		this.sendReply('You are now blocking all incoming challenge requests.');
	},

	back: 'allowchallenges',
	allowchallenges: function(target, room, user) {
		user.blockChallenges = false;
		this.sendReply('You are available for challenges from now on.');
	},

	cchall: 'cancelChallenge',
	cancelchallenge: function(target, room, user) {
		user.cancelChallengeTo(target);
	},

	accept: function(target, room, user) {
		var userid = toUserid(target);
		var format = '';
		if (user.challengesFrom[userid]) format = user.challengesFrom[userid].format;
		if (!format) {
			this.popupReply(target+" cancelled their challenge before you could accept it.");
			return false;
		}
		var problems = Tools.validateTeam(user.team, format);
		if (problems) {
			this.popupReply("Your team was rejected for the following reasons:\n\n- "+problems.join("\n- "));
			return false;
		}
		user.acceptChallengeFrom(userid);
	},

	reject: function(target, room, user) {
		user.rejectChallengeFrom(toUserid(target));
	},

	saveteam: 'useteam',
	utm: 'useteam',
	useteam: function(target, room, user) {
		try {
			user.team = JSON.parse(target);
		} catch (e) {
			this.popupReply('Not a valid team.');
		}
	},

	/*********************************************************
	 * Low-level
	 *********************************************************/

	cmd: 'query',
	query: function(target, room, user, connection) {
		var spaceIndex = target.indexOf(' ');
		var cmd = target;
		if (spaceIndex > 0) {
			cmd = target.substr(0, spaceIndex);
			target = target.substr(spaceIndex+1);
		} else {
			target = '';
		}
		if (cmd === 'userdetails') {
			var targetUser = Users.get(target);
			if (!targetUser) {
				connection.send('|queryresponse|userdetails|'+JSON.stringify({
					userid: toId(target),
					rooms: false
				}));
				return false;
			}
			var roomList = {};
			for (var i in targetUser.roomCount) {
				if (i==='global') continue;
				var targetRoom = Rooms.get(i);
				if (!targetRoom || targetRoom.isPrivate) continue;
				var roomData = {};
				if (targetRoom.battle) {
					var battle = targetRoom.battle;
					roomData.p1 = battle.p1?' '+battle.p1:'';
					roomData.p2 = battle.p2?' '+battle.p2:'';
				}
				roomList[i] = roomData;
			}
			if (!targetUser.roomCount['global']) roomList = false;
			var userdetails = {
				userid: targetUser.userid,
				avatar: targetUser.avatar,
				rooms: roomList
			};
			if (user.can('ip', targetUser)) {
				var ips = Object.keys(targetUser.ips);
				if (ips.length === 1) {
					userdetails.ip = ips[0];
				} else {
					userdetails.ips = ips;
				}
			}
			connection.send('|queryresponse|userdetails|'+JSON.stringify(userdetails));
		} else if (cmd === 'roomlist') {
			connection.send('|queryresponse|roomlist|'+JSON.stringify({
				rooms: Rooms.global.getRoomList(true)
			}));
		}
	},

	trn: function(target, room, user, connection) {
		var commaIndex = target.indexOf(',');
		var targetName = target;
		var targetAuth = false;
		var targetToken = '';
		if (commaIndex >= 0) {
			targetName = target.substr(0,commaIndex);
			target = target.substr(commaIndex+1);
			commaIndex = target.indexOf(',');
			targetAuth = target;
			if (commaIndex >= 0) {
				targetAuth = !!parseInt(target.substr(0,commaIndex),10);
				targetToken = target.substr(commaIndex+1);
			}
		}
		user.rename(targetName, targetToken, targetAuth, connection.socket);
	},

};
