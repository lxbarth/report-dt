var osmium = require('osmium');
var numeral = require('numeral');
var argv = require('optimist').argv;
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('dbreport.sqlite');


var obj_way = function() {
	return {
		highways: {
			v1: 0,
			vx: 0,
			oneways: 0,
			bridges: 0
		},
		buildings: {
			v1: 0,
			vx: 0
		}
	};
};

function format_num(n) {
	return numeral(n).format('0,0');
}
var osmfile = argv.osmfile;
var users = argv.users.split(",");
var count = {};
for (var k = 0; k < users.length; k++) {
	var way = {
		way: new obj_way()
	};
	count[users[k]] = way;
};
var file = new osmium.File(osmfile);
var reader = new osmium.Reader(file);
var handler = new osmium.Handler();
var day, hour = '';
var check_hour = true;
handler.on('way', function(way) {
	if (check_hour) {
		console.log(way.timestamp);
		var date = new Date(parseFloat(way.timestamp) * 1000);
		console.log(date);
		hour = date.getHours();
		console.log('hour:' + hour);
		//day = moment.unix(way.timestamp).format('YYYY-MM-DD');
		day = date.getUTCFullYear() + '-' + (parseInt(date.getUTCMonth()) + 1) + '-' + date.getUTCDate() + '-' + date.getHours();
		console.log(day);
		check_hour = false;
	}
	if (typeof way.tags().highway !== 'undefined' && users.indexOf(way.user) !== -1) { //evalua las calles	
		if (way.version === 1) {
			++count[way.user].way.highways.v1;
		} else {
			++count[way.user].way.highways.vx;
		}
	}
});


reader.apply(handler);
db.serialize(function() {
	var stmt = db.prepare("INSERT INTO osm_data VALUES (?,?,?,?)");
	for (var i = 0; i < users.length; i++) {
		stmt.run(users[i], day, count[users[i]].way.highways.v1, count[users[i]].way.highways.vx);
	};
	stmt.finalize();
});
db.close();