const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');

const datastore = ds.datastore;

const LODGING = "Lodging";
const GUEST = "Guest";

const BOAT = "Boat";
const LOAD = "Load";
const BOATLOAD = "Boatload"

router.use(bodyParser.json());



/* ------------- Begin Lodging Model Functions ------------- */
/************************ POST HELPER FUNCTIONS******************************/
//helper function to post but with empty array as load (TODO:should it be undefined instead)
async function post_boat(name, type, length ){
    // if (!length || !type || !name ){
    //     console.log ("missing parameter")
    // }
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




//put function for boat (not using currently)
function put_boat(id, name, length){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    const boat  = {"name": name, "type": type, "length": length, "loads": [] };
    return datastore.save({"key":key, "data":boat});
}


/************************ PUT HELPER FUNCTIONS ******************************/
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
       
        // if( load[0].carrier.id ==='null'){
        //     console.log("In put_load_carrier: load.carrier is null")
       

        //     console.log("In put_load_carrier: data to be loaded" + data)
        // }
        
    
        return datastore.save({"key":l_key, "data":load[0]});
    });

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






/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

// router.get('/', function(req, res){
//     const lodgings = get_lodgings(req)
// 	.then( (lodgings) => {
//         res.status(200).json(lodgings);
//     });
// });

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

//get boat's loads
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
                console.error('Router.get: There was an error', err);
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


        }).catch((err)=>{
            console.log('In router.put caught ' + err); 
                res.status(404).send({"Error": "The specified boat does not exist"});
        }); 

        check_if_entity_exists(l_key).then(
            load=>{

             if (load[0].carrier.id == null){
                put_load_carrier(req.params.b_id, req.params.l_id)
                .then(
                 
                    console.log ("router.put: load after save" + JSON.stringify(load[0].carrier.id)),
                       
                    res.status(204).send()); 
             }else {
                console.log ("router.put: load after save" + JSON.stringify(load[0].carrier.id));
                res.status(403).send({"Error": "The load's carrier is already assigned"}); 
             }
             
            
    
            }).catch((err)=>{
                console.log('In router.put caught ' + err); 
                    res.status(404).send({"Error": "The specified load does not exist"});
            }); 
         
     
    
    

    //  put_load_carrier(req.params.b_id, req.params.l_id).then(
    //     datastore.get(l_key, (err, load) =>{ 
    //         console.log ("router.put: load after save" + JSON.stringify(load))
    //         console.log ("router.put: load  after save" + JSON.stringify(load.carrier.id))
    //         }),
    //     res.status(204).send());    
        });
  
//Remove load from boat
router.delete('/:b_id/loads/:l_id', function(req, res){ 
    const boat_key = datastore.key([BOAT, parseInt(req.params.b_id,10)]);
    const load_key = datastore.key([LOAD, parseInt(req.params.l_id,10)]);
        //see if boat is there then return boat
        check_if_entity_exists(boat_key).then(
            boat=>{
            
            console.log("Here's what's in the boat "+ JSON.stringify(Object.keys(boat)))
            console.log("Here's how to dereference load "+ JSON.stringify(boat[0].load))
            console.log("Here's what's in l_id "+ req.params.l_id)
                    //see 
                    if (!boat[0].load.includes(req.params.l_id) ){
                    
                        res.status(404).send({"Error":"No load with this load_id is at the boat with this boat_id"});
             
                    }else{
                    console.log("Here is what's in boat laod before put " + boat[0].load)
                    console.log ("Here is index of the item "+ boat[0].load.indexOf(req.params.l_id))
                    const indexOfLoad=boat[0].load.indexOf(req.params.l_id) 
                    console.log ("Here is the item at the index "+ boat[0].load[indexOfLoad])
                    const loadArray=boat[0].load;
                    console.log ("Here is loadArray before splice "+ loadArray)
        
                    loadArray=loadArray.splice(indexOfLoad, 1) 
                    console.log("loadArray" + loadArray)
                    resData = {
                        id: boat_key.id,
                        name: boat.name,
                        type: boat.type,
                        length: boat.length,
                        load: loadArray,
                        self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + boat_key.id 
                        }
                    }
                }).then(res.status(204).send())
           datastore.get(load_key, (err, load) =>{
            //console.log(slip)
            if (err) {
                console.error('There was an error while getting load', err);
                res.status(400).send({"Error":"No load with this load_id is at the boat with this boat_id"});
               
            }else{

            
                
            
            }
           
            })
            
            })
            // .catch((error)=>{
            //     console.log('In router.delete boat from slip caught ' + error); 
            //         res.status(404).send({"Error": "No boat with this boat_id is at the slip with this slip_id"});
            // });  
// });

router.delete('/:id', function(req, res){
    delete_lodging(req.params.id).then(res.status(200).end())
});

/* ------------- End Controller Functions ------------- */

module.exports = router;