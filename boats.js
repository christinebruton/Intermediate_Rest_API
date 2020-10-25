const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');

const datastore = ds.datastore;

const LODGING = "Lodging";
const GUEST = "Guest";

const BOAT = "Boat";
const LOAD = "Load";

router.use(bodyParser.json());



/* ------------- Begin Lodging Model Functions ------------- */
/************************ POST HELPER FUNCTIONS******************************/
async function post_boat(name, type, length ){
    if (!length || !type || !name ){
        console.log ("missing parameter")
    }
    var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length, "load":[] };
    await datastore.save({ "key": key, "data": new_boat });
    return key;
}


//**************GET HELPER ********* */
async function get_boats(req){
    var q = datastore.createQuery(BOAT).limit(3);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){ //if there is a cursor
        q = q.start(req.query.cursor); //set the start point of the query to that cursor location
    }
	const entities = await datastore.runQuery(q);
    results.items = entities[0].map(ds.fromDatastore);
    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
        results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;
}


function get_lodging_guests(req, id){
    const key = datastore.key([LODGING, parseInt(id,10)]);
    return datastore.get(key)
    .then( (lodgings) => {
        const lodging = lodgings[0];
        const guest_keys = lodging.guests.map( (g_id) => {
            return datastore.key([GUEST, parseInt(g_id,10)]);
        });
        return datastore.get(guest_keys);
    })
    .then((guests) => {
        guests = guests[0].map(ds.fromDatastore);
        return guests;
    });
}


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

async function check_if_boats_exists(keyObj){
  
    try {
        const entity = await datastore.get(keyObj);
        return entity;
    } catch (error) {
        console.log('caught ' + error);
        throw error;
    }
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

function put_reservation(lid, gid){
    const l_key = datastore.key([LODGING, parseInt(lid,10)]);
    return datastore.get(l_key)
    .then( (lodging) => {
        if( typeof(lodging[0].guests) === 'undefined'){
            lodging[0].guests = [];
        }
        lodging[0].guests.push(gid);
        return datastore.save({"key":l_key, "data":lodging[0]});
    });

}

//put helper for put route
async function put_boat_load(b_id, l_id){
    console.log("in put boat load b_id" + b_id + "l_id" + l_id)
    const b_key = datastore.key([BOAT, parseInt(b_id,10)]);
    const boat = await datastore.get(b_key);
    console.log("typof Boat[0].load" + typeof (boat[0].load));
    if (typeof (boat[0].load) === 'undefined') {
        boat[0].load = [];
    }
    boat[0].load.push(l_id);
    console.log(JSON.stringify(boat[0].load));
    return datastore.save({ "key": b_key, "data": boat[0] });

}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', function(req, res){
    const lodgings = get_lodgings(req)
	.then( (lodgings) => {
        res.status(200).json(lodgings);
    });
});

router.get('/', function(req, res){
    const boats = get_boats(req)
	.then( (boats) => {
        res.status(200).json(boats);
    });
});

// router.get('/:id/guests', function(req, res){
//     const lodgings = get_lodging_guests(req, req.params.id)
// 	.then( (lodgings) => {
//         res.status(200).json(lodgings);
//     });
// });

//get boat
router.get('/:id/loads', function(req, res){
    const boats = get_boat_loads(req, req.params.id)
	.then( (boats) => {
        res.status(200).json(boats);
    });
});


// router.post('/', function(req, res){
//     post_lodging(req.body.name, req.body.description, req.body.price)
//     .then( key => {res.status(200).send('{ "id": ' + key.id + ' }')} );
// });

// router.post('/', function(req, res){
//     post_boat(req.body.name, req.body.type, req.body.length)
//     .then( key => {res.status(201).send('{ "id": ' + key.id + ' }')} );
// });

//Get a Boat
router.get('/:id', function(req, res){
    const key = datastore.key([BOAT, parseInt(req.params.id,10)]);
    
    datastore.get(key, (err, boat) => {
            if (err) {
                console.error('There was an error', err);
                res.status(404).send({"Error":"No boat with this boat_id exists"});
                return;
            }
    queryData = {
            id: req.params.id,
            name: boat.name,
            type: boat.type,
            length: boat.length,
            load: boat.load,
            self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + key.id 
        };
        console.log(queryData);
        res.status(200).json(queryData)
    });
});

//Create a boat
router.post('/', function(req, res){
    const reqLen = req.body.length;
    const reqType = req.body.type;
    const reqName = req.body.name;
    if (!reqLen || !reqType || !reqName){
        res.status(400).send({"Error":"The request object is missing at least one of the required attributes"});
    }
   post_boat(req.body.name, req.body.type, req.body.length)  
   .then( key => {
            console.log(key)
            resData = {
                id: key.id,
                name: req.body.name,
                type: req.body.type,
                length: req.body.length,
                load: req.body.load,
                self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + key.id 
            };
        res.status(201).send(resData)}).catch((error)=>{
                console.log('In router.post ' + error); 
                res.status(404).send({"Error": "The specified boat and/or slip does not exist"});
                }); 
});

router.put('/:id', function(req, res){
    put_lodging(req.params.id, req.body.name, req.body.description, req.body.price)
    .then(res.status(200).end());
});



router.put('/:lid/guests/:gid', function(req, res){
    put_reservation(req.params.lid, req.params.gid)
    .then(res.status(200).end());
});

router.put('/:b_id/loads/:l_id', function(req, res){
    const l_key = datastore.key([LOAD, parseInt(req.params.l_id,10)]);
    const b_key = datastore.key([BOAT, parseInt(req.params.b_id,10)]);
    check_if_boats_exists(b_key).then(boat=>{

        datastore.get(l_key, (err, load) =>{
         //console.log(slip)
         if (err) {
             console.error('There was an error', err);
             res.status(404).send({"Error":"The specified load does not exist"});
            
         }else {
            put_boat_load(req.params.b_id, req.params.l_id);
            res.status(204).end()
         }
        
     })
             //res.status(204).send();
             console.log("got a boat");
         }).catch((error)=>{
             console.log('In router.put caught ' + error); 
                 res.status(404).send({"Error": "The specified boat does not exist"});
         }); 





    // console.log("here's whats in put route" + JSON.stringify(req.params) )
    // put_boat_load(req.params.b_id, req.params.l_id)
    // .then(res.status(204).end());
});

router.delete('/:id', function(req, res){
    delete_lodging(req.params.id).then(res.status(200).end())
});

/* ------------- End Controller Functions ------------- */

module.exports = router;