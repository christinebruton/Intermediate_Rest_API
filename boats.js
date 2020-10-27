const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');

const datastore = ds.datastore;

;

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
        console.log('caught ' + error);
        throw error;
    }
}


/************************ PUT HELPER FUNCTIONS ******************************/


function delete_boat(id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.delete(key);
}



//put helper for put route
function put_boat_load(b_id, l_id){
    const l_key = datastore.key([LOAD, parseInt(l_id,10)]);
    const b_key = datastore.key([BOAT, parseInt(b_id,10)]);
    console.log("put_boat_load: in put boat load b_id" + JSON.stringify(b_id) + "l_id" + JSON.stringify(l_id))
    return datastore.get(b_key)
    .then( (boat) => {
       
        if( typeof(boat[0].loads) === 'undefined'){
            boat[0].loads = [];
        }
        boat[0].loads.push(l_id);
        console.log ("In put_boat_load"+ boat[0].loads)
        return datastore.save({"key":b_key, "data":boat[0]});
    });

}

function put_load_carrier(b_id, l_id){
    const l_key = datastore.key([LOAD, parseInt(l_id,10)]);
    const b_key = datastore.key([BOAT, parseInt(b_id,10)]);
    console.log("put_load_Carrier: b_id" + JSON.stringify(b_id) + "l_id" + JSON.stringify(l_id))
    return datastore.get(l_key)
    .then( (load) => {
        console.log ("put_load_carrier . then load.carrier"+JSON.stringify(load[0].carrier.id))
        load[0].carrier.id = b_id
        console.log ("put_load_carrier . then after PUSH "+JSON.stringify(load[0].carrier.id))
        console.log ("put_load_carrier . then after PUSH load[0]"+JSON.stringify(load[0]))
        console.log ("put_load_carrier . then after PUSH load"+JSON.stringify(load))
       
        return datastore.save({"key":l_key, "data":load[0]});
    });

}

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
        console.log ("In delete_boat_load "+ boat[0].loads)
        const array = boat[0].loads;
 
        const valueToRemove = l_id;
        console.log ("value "+valueToRemove)
        const filteredItems = array.filter((item) => item !== valueToRemove)
        console.log ("filtered "+ filteredItems)
        boat[0].loads = filteredItems;
        console.log ("boat[0].loads after filer "+ boat[0].loads) 
        return datastore.save({"key":b_key, "data":boat[0]});
    });

}


function delete_load_carrier(b_id, l_id){
    const l_key = datastore.key([LOAD, parseInt(l_id,10)]);
    const b_key = datastore.key([BOAT, parseInt(b_id,10)]);
    console.log("delete_load_carrier: b_id" + JSON.stringify(b_id) + "l_id" + JSON.stringify(l_id))
    return datastore.get(l_key)
    .then( (load) => {
        console.log ("delete_load_carrier . then load.carrier"+JSON.stringify(load[0].carrier.id))
        load[0].carrier.id = null;
        console.log ("delete_load_carrier . then after PUSH "+JSON.stringify(load[0].carrier.id))
        console.log ("delete_load_carrier . then after PUSH load[0]"+JSON.stringify(load[0]))
        console.log ("delete_load_carrier . then after PUSH load"+JSON.stringify(load))
       
        return datastore.save({"key":l_key, "data":load[0]});
    });

}



/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */



router.get('/', function(req, res){
    const boats = get_boats(req)
	.then( (boats) => {
        res.status(200).json(boats);
    });
});



//get boat's loads
router.get('/:id/loads', function(req, res){
    const boats = get_boat_loads(req, req.params.id)
	.then( (boats) => {
        res.status(200).json(boats);
    });
});




//Get a Boat
router.get('/:id', function(req, res){
    const key = datastore.key([BOAT, parseInt(req.params.id,10)]);
    
    datastore.get(key, (err, boat) => {
            if (err) {
                console.error('Router.get: There was an error', err);
                res.status(404).send({"Error":"No boat with this boat_id exists"});
                return;
            }
            if( typeof(boat[0]) === 'undefined'){
                boat['loads'] = [];
            }     
    
    queryData = {
            id: req.params.id,
            name: boat.name,
            type: boat.type,
            length: boat.length,
            load: boat['loads'][0],
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
    }else{
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
    }

});

router.put('/:id', function(req, res){
    put_lodging(req.params.id, req.body.name, req.body.description, req.body.price)
    .then(res.status(200).end());
});



router.put('/:b_id/loads/:l_id', function(req, res, err){
    const l_key = datastore.key([LOAD, parseInt(req.params.l_id,10)]);
    const b_key = datastore.key([BOAT, parseInt(req.params.b_id,10)]);
    check_if_entity_exists(b_key).then(
        boat=>{


            put_boat_load(req.params.b_id, req.params.l_id).then(key=>{console.log ('In router.put'+ JSON.stringify(boat[0].loads))});
        }).catch((err)=>{
            console.log('In router.put caught ' + err); 
                res.status(404).send({"Error": "The specified boat does not exist"});
        }); 

        check_if_entity_exists(l_key).then(
            load=>{

             if (load[0].carrier.id == null){
                put_load_carrier(req.params.b_id, req.params.l_id)
                .then(
                        
                    res.status(204).send()); 
             }else {
                console.log ("router.put: load after save" + JSON.stringify(load[0].carrier.id));
                res.status(403).send({"Error": "The load's carrier is already assigned"}); 
             }
             
            
    
            }).catch((err)=>{
                console.log('In router.put caught ' + err); 
                    res.status(404).send({"Error": "The specified load does not exist"});
            }); 
         
   
        });
  
//Remove load from boat
router.delete('/:b_id/loads/:l_id', function(req, res){ 
    const b_key = datastore.key([BOAT, parseInt(req.params.b_id,10)]);
    const l_key = datastore.key([LOAD, parseInt(req.params.l_id,10)]);
    check_if_entity_exists(b_key).then(
        boat=>{


        delete_boat_load(req.params.b_id, req.params.l_id).then(key=>{console.log ('In router.delete'+ JSON.stringify(boat[0].loads)), res.status(204).end()});
        }).catch((err)=>{
            console.log('In router.delete caught ' + err); 
                res.status(404).send({"Error": "The specified boat does not exist"});
        });  

        check_if_entity_exists(l_key).then(
            load=>{

             if (load[0].carrier.id != null){
               
                delete_load_carrier(req.params.b_id, req.params.l_id).then(
                    res.status(204).send()); 

             }else {
                console.log ("router.delete: load after delete" + JSON.stringify(load[0].carrier.id));
                res.status(403).send({"Error": "The load does not have a carrier"}); 
             }
    
            }).catch((err)=>{
                console.log('In router.delete  caught ' + err); 
                    res.status(404).send({"Error": "The specified load does not exist"});
            }); 


            
     })
  

router.delete('/:id', function(req, res){
    delete_boat(req.params.id).then(res.status(204).end())
});

/* ------------- End Controller Functions ------------- */

module.exports = router;