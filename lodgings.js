const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');

const datastore = ds.datastore;

const LODGING = "Lodging";
const GUEST = "Guest";

router.use(bodyParser.json());



/* ------------- Begin Lodging Model Functions ------------- */
/************************ POST HELPER FUNCTIONS******************************/
async function post_boat(name, type, length, loads){
    if (!length || !type || !name ){
        console.log ("missing parameter")
    }
    var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length, "loads": [] };
    await datastore.save({ "key": key, "data": new_boat });
    return key;
}

function post_lodging(name, description, price){
    var key = datastore.key(LODGING);
	const new_lodging = {"name": name, "description": description, "price": price};
	return datastore.save({"key":key, "data":new_lodging}).then(() => {return key});
}

function get_lodgings(req){
    var q = datastore.createQuery(LODGING).limit(2);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
            results.items = entities[0].map(ds.fromDatastore);
            if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
            }
			return results;
		});
}

function get_boats(req){
    var q = datastore.createQuery(BOAT).limit(3);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
            results.items = entities[0].map(ds.fromDatastore);
            if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
            }
			return results;
		});
}



//similar to joining keys in db
//****************** store guest IDs but when returning make guests URLS instead of ids */
function get_lodging_guests(req, id){
    const key = datastore.key([LODGING, parseInt(id,10)]);
    return datastore.get(key)
    .then( (lodgings) => {
        const lodging = lodgings[0];
        const guest_keys = lodging.guests.map( (g_id) => { //makes guest keys into an array of actual keys
            return datastore.key([GUEST, parseInt(g_id,10)]); //return datastore keys
        });
        return datastore.get(guest_keys); //take an array of keys and get back array of objects
    })
    .then((guests) => {
        guests = guests[0].map(ds.fromDatastore); //make keys readable
        return guests;
    });
}


function get_boat_loads(req, id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.get(key)
    .then( (boats) => {
        const boat = boats[0];
        const load_keys = boat.loads.map( (l_id) => {
            return datastore.key([LOAD, parseInt(l_id,10)]);
        });
        return datastore.get(load_keys);
    })
    .then((loads) => {
        loads = loads[0].map(ds.fromDatastore);
        return loads;
    });
}


function put_lodging(id, name, description, price){
    const key = datastore.key([LODGING, parseInt(id,10)]);
    const lodging = {"name": name, "description": description, "price": price};
    return datastore.save({"key":key, "data":lodging});
}


function put_boat(id, name, description, price){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    const boat  = {"name": name, "type": type, "length": length, "loads": [] };
    return datastore.save({"key":key, "data":boat});
}



function delete_lodging(id){
    const key = datastore.key([LODGING, parseInt(id,10)]);
    return datastore.delete(key);
}
function delete_boat(id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.delete(key);
}

//in params ->lodgings/lodging_id/guests/guest_id
function put_reservation(lid, gid){
    const l_key = datastore.key([LODGING, parseInt(lid,10)]);
    return datastore.get(l_key)
    .then( (lodging) => {
        if( typeof(lodging[0].guests) === 'undefined'){ //set of results are in 0th entry, check if guests already
            lodging[0].guests = [];//if no guests, then set to empty array
        }
        lodging[0].guests.push(gid);//add new gues id past in 
        return datastore.save({"key":l_key, "data":lodging[0]}); //save to datastore
    });

}


function put_boatLoad(b_id, l_id){
    const b_key = datastore.key([BOAT, parseInt(b_id,10)]);
    return datastore.get(b_key)
    .then( (boat) => {
        if( typeof(boat[0].guests) === 'undefined'){
            boat[0].load = [];
        }
        boat[0].load.push(l_id);
        return datastore.save({"key":b_key, "data":boat[0]});
    });

}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', function(req, res){
    const lodgings = get_lodgings(req)
	.then( (lodgings) => {
        res.status(200).json(lodgings);
    });
});

router.get('/:id/guests', function(req, res){
    const lodgings = get_lodging_guests(req, req.params.id)
	.then( (lodgings) => {
        res.status(200).json(lodgings);
    });
});

router.post('/', function(req, res){
    post_lodging(req.body.name, req.body.description, req.body.price)
    .then( key => {res.status(200).send('{ "id": ' + key.id + ' }')} );
});



router.put('/:id', function(req, res){
    put_lodging(req.params.id, req.body.name, req.body.description, req.body.price)
    .then(res.status(200).end());
});

router.put('/:lid/guests/:gid', function(req, res){
    put_reservation(req.params.lid, req.params.gid)
    .then(res.status(200).end());
});

router.delete('/:id', function(req, res){
    delete_lodging(req.params.id).then(res.status(200).end())
});

/* ------------- End Controller Functions ------------- */

module.exports = router;