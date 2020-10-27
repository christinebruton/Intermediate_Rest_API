const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');

const datastore = ds.datastore;

const BOAT = "Boat";
const LOAD = "Load";

router.use(bodyParser.json());



/* ------------- Begin Lodging Model Functions ------------- */
/************************ POST HELPER FUNCTIONS******************************/
//helper function to post but with empty array as load (TODO:should it be undefined instead)
async function post_boat(name, type, length ){
   
    var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length};
    await datastore.save({ "key": key, "data": new_boat });
    return key;
}


//**************GET HELPER ********* */
//for view boats helper funciton to get boats and display 3 at a time
async function get_boats(req){
    var q = datastore.createQuery(BOAT).limit(4);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){ //if there is a cursor
        q = q.start(req.query.cursor); //set the start point of the query to that cursor location
    }
	const entities = await datastore.runQuery(q);
    results.allBoats = entities[0].map(ds.fromDatastore);
    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
        results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;
}


//goes with router.get('/:id/loads', function(req, res)
async function get_boat_loads(req, id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    const boats = await datastore.get(key);
    const boat = boats[0];
    const load_keys = boat.loads.map((l_id) => {
        return datastore.key([LOAD, parseInt(l_id, 10)]);
    });
    const loads = await datastore.get(load_keys);
    loads = loads[0].map(ds.fromDatastore);
    return loads;
}

/************************ PUT HELPER FUNCTIONS ******************************/

async function check_if_entity_exists(keyObj){
  
    try {
        const entity = await datastore.get(keyObj);
        return entity;
    } catch (error) {
        console.log('check_if_entity_exists: caught ' + error);
        throw error;
    }
}

/************************ PUT HELPER FUNCTIONS ******************************/


function delete_boat(id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.delete(key);
}

//put helper for put route
async function put_boat_load(b_id, l_id){
    const l_key = datastore.key([LOAD, parseInt(l_id,10)]);
    const b_key = datastore.key([BOAT, parseInt(b_id,10)]);
    const boat = await datastore.get(b_key);
    if (typeof (boat[0].loads) === 'undefined') {
        boat[0].loads = [];
    }
    boat[0].loads.push(l_id);
    console.log("In put_boat_load after PUSH l_id " + boat[0].loads);
    return datastore.save({ "key": b_key, "data": boat[0] });

}

//put boat into carrier 
async function put_load_carrier(b_id, l_id){
    const l_key = datastore.key([LOAD, parseInt(l_id,10)]);
    const b_key = datastore.key([BOAT, parseInt(b_id,10)]);
    const load = await datastore.get(l_key);
    load[0].carrier.id = b_id;
    console.log("put_load_carrier after load[0].carrier.id = b_id " + JSON.stringify(load));
    return datastore.save({ "key": l_key, "data": load[0] });
}

//delete load from boat 
function delete_boat_load(b_id, l_id){
    const l_key = datastore.key([LOAD, parseInt(l_id,10)]);
    const b_key = datastore.key([BOAT, parseInt(b_id,10)]);
    console.log("delete_boat_load:  b_id" + JSON.stringify(b_id) + "l_id" + JSON.stringify(l_id))
    return datastore.get(b_key)
    .then( (boat) => {
        if( typeof(boat[0].loads) === 'undefined'){
            boat[0].loads = [];
        }
        boat[0].loads.push(l_id);
        console.log ("delete_boat_load: boat[0].load "+ boat[0].loads)
        const array = boat[0].loads;
        const valueToRemove = l_id;
        const filteredItems = array.filter((item) => item !== valueToRemove)
        boat[0].loads = filteredItems;
        console.log ("delete_boat_load: boat[0].loads after deleting load "+ boat[0].loads) 
        return datastore.save({"key":b_key, "data":boat[0]});
    });
}

//delete carrier from load 
function delete_load_carrier(b_id, l_id){
    const l_key = datastore.key([LOAD, parseInt(l_id,10)]);
    const b_key = datastore.key([BOAT, parseInt(b_id,10)]);
    console.log("delete_load_carrier: b_id" + JSON.stringify(b_id) + "l_id" + JSON.stringify(l_id))
    return datastore.get(l_key)
    .then( (load) => {
        console.log ("delete_load_carrier: before deletion "+JSON.stringify(load[0].carrier.id))
        load[0].carrier.id = null;
        console.log ("delete_load_carrier . then after deletion load[0].carrier.id) "+JSON.stringify(load[0].carrier.id))
        console.log ("delete_load_carrier . then after deletion load[0]"+JSON.stringify(load[0]))
        console.log ("delete_load_carrier . then after deletion load"+JSON.stringify(load[0]))
        return datastore.save({"key":l_key, "data":load[0]});
    }).catch((error)=>{
        console.log('In delete_load_carrier ' + error); 
        res.status(404).send({"Error": "Delete of carrier did not work"});
        }); 

}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */


/* ------------- End Controller Functions ------------- */
module.exports.check=check_if_entity_exists;
module.exports.dbl = delete_boat_load;