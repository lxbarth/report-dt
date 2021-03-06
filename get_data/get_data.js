var osmium = require('osmium');
var numeral = require('numeral');
var request = require('request');
var fs = require('fs');
var zlib = require('zlib');
var _ = require('underscore');
var pg = require('pg');
var conString = "postgres://postgres:1234@localhost/dbstatistic";
var osm_file = '';
var obj = function() {
	return {
		osm_user: {
			osmuser: null,
			color: null
		},
		osm_date: {
			osmfile: null,
			osmdate: 0
		},
		osm_node: {
			v1: 0,
			vx: 0
		},
		osm_way: {
			v1: 0,
			vx: 0
		},
		osm_relation: {
			v1: 0,
			vx: 0
		}
	};
};
var client = new pg.Client(conString);
client.connect(function(err) {
	if (err) {
		return console.error('could not connect to postgres', err);
	}
});

function format_num(n) {
	return numeral(n).format('0,0');
}

function download_file(url, localFile, callback) {
	console.log('Start download : ' + url);
	var localStream = fs.createWriteStream(localFile);
	var out = request({
		uri: url
	});
	out.on('response', function(resp) {
		if (resp.statusCode === 200) {
			out.pipe(zlib.createGunzip()).pipe(localStream);
			localStream.on('close', function() {
				callback(null, localFile);
			});
		} else
			callback(new Error("No file found at given url."), null);
	});
};

function proces_file_save(callback) {
	var osmfile = osm_file;
	var count = {};
	var query_user = "SELECT iduser, osmuser, color, estado FROM osm_user";
	var main_query = client.query(query_user, function(error, result) {
		if (error) {
			console.log(error);
			res.statusCode = 404;
			return res.send('Error 404: No quote found');
		} else {
			try {
				for (var i = 0; i < result.rows.length; i++) {
					user = new obj();
					count[result.rows[i].iduser] = user;
				}
				//Procesamiento de datos
				var file = new osmium.File(osmfile);
				var reader = new osmium.Reader(file);
				var handler = new osmium.Handler();
				//WAY
				handler.on('way', function(way) {
					osmdate = way.timestamp;
					osmdate = osmdate - osmdate % 1000;
					console.log(osmdate);
					if (count.hasOwnProperty(way.uid) && _.size(way.tags()) > 0) {
						if (way.version === 1) {
							++count[way.uid].osm_way.v1;
						} else {
							++count[way.uid].osm_way.vx;
						}
					}
				});
				//NODE
				handler.on('node', function(node) {
					if (count.hasOwnProperty(node.uid) && _.size(node.tags()) > 0) {
						if (node.version === 1) {
							++count[node.uid].osm_node.v1;
						} else {
							++count[node.uid].osm_node.vx;
						}
					}
				});
				//RELATION
				handler.on('relation', function(relation) {
					if (count.hasOwnProperty(relation.uid) && _.size(relation.tags()) > 0) {
						if (relation.version === 1) {
							++count[relation.uid].osm_node.v1;
						} else {
							++count[relation.uid].osm_node.vx;
						}
					}
				});
				reader.apply(handler);
				//insert date
				var insert_osm_obj = true;
				var query_data = 'INSERT INTO osm_date(idfile, osmdate)  VALUES ($1, $2);';
				client.query(query_data, [name_directory + '-' + name_file, osmdate],
					function(err, result) {
						if (err) {
							insert_osm_obj = false;
							console.log(err);
						} else {
							insert_osm_obj = true;
						}
					});

				if (insert_osm_obj) {
					_.each(count, function(val, key) {
						var obj_data = [];
						obj_data.push(key);
						obj_data.push(osmdate);
						obj_data.push(val.osm_node.v1);
						obj_data.push(val.osm_node.vx);
						obj_data.push(val.osm_way.v1);
						obj_data.push(val.osm_way.vx);
						obj_data.push(val.osm_relation.v1);
						obj_data.push(val.osm_relation.vx);
						var query_insert = "INSERT INTO osm_obj( iduser, osmdate, node_v1, node_vx, way_v1, way_vx, relation_v1, relation_vx)VALUES ($1, $2, $3, $4, $5, $6, $7, $8);"
						client.query(query_insert, obj_data,
							function(err, result) {
								if (err) {
									console.log('No insertados');
									console.log(err);
								}
							});
					});
				}
			} catch (e) {
				console.log("entering catch block");
			}
		}
	});

	main_query.on('end', function(result) {
		//remove file
		if (!fs.exists(osm_file)) {
			var tempFile = fs.openSync(osm_file, 'r');
			fs.closeSync(tempFile);
			fs.unlinkSync(osm_file);
			console.log('Remove file :' + osm_file);
		} else {
			console.log('Error in remove file');
		}
	});
}

function get_url_file() {
		if (num_file < 10) {
			name_file = '00' + num_file;
			num_file++;
		} else if (num_file >= 10 && num_file < 100) {
			name_file = '0' + num_file;
			num_file++;
		} else if (num_file >= 100 && num_file < 1000) {
			name_file = '' + num_file;
			num_file++;
		} else {
			num_file = 0;
			num_directory++;
			name_directory = '0' + num_directory;
		}
		return url + '/' + name_directory + '/' + name_file + '.osc.gz';
	}
	//intitializar parameters
var url = 'http://planet.openstreetmap.org/replication/hour/000';
var name_file = '';
var num_file = 962;
var num_directory = 20;
var name_directory = ''
name_directory = '0' + num_directory;
var osmdate = 0;
setInterval(function() {
	var url_file = get_url_file();
	osm_file = name_file + '.osc'
	request(url_file, function(err, resp, body) {
		if (!err && resp.statusCode == 200) {
			console.log(url_file);
			download_file(url_file, osm_file, proces_file_save);
		} else {
			console.log('no existe : ' + url_file);
			if (num_file === 1) {
				num_file = 999;
				name_directory = name_directory - 1;
			} else {
				num_file = num_file - 1;
			}
		}
	});
}, 10 * 60 * 1000);