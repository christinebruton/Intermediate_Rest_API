const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const ds = require('./datastore');

const datastore = ds.datastore;

const GUEST = "Guest";
const LOAD  = "Load";

router.use(bodyParser.json());

const u = require('./utils.js');




/* ------------- Begin guest Model Functions ------------- */

/************************ POST HELPER FUNCTIONS******************************/

//post helper function
async function post_load(loadObj){
    var key = datastore.key(LOAD);
	const new_load = {"weight": loadObj.weight, "carrier": loadObj.carrier, "content": loadObj.content,"delivery_date": loadObj.delivery_date};
	await datastore.save({ "key": key, "data": new_load });
    return key;
}

//get helper function
async function get_loads(req){
    var q = datastore.createQuery(LOAD).limit(4);
    const results = {};
    var prev;
    if(Object.keys(req.query).includes("cursor")){
        prev = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + req.query.cursor;
        q = q.start(req.query.cursor);
    }
	const entities = await datastore.runQuery(q);
    results.allLoads = entities[0].map(ds.fromDatastore);
    if (typeof prev !== 'undefined') {
        results.previous = prev;
    }
    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) { //see if there are more results
        results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;
}


function put_guest(id, name){
    const key = datastore.key([GUEST, parseInt(id,10)]);
    const guest = {"name": name};
    return datastore.save({"key":key, "data":guest});
}

function delete_guest(id){
    const key = datastore.key([GUEST, parseInt(id,10)]);
    return datastore.delete(key);
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

//get loads
router.get('/', function(req, res){
    const loads = get_loads(req)
	.then( (loads) => {
        res.status(200).json(loads);
    });
});


//Get a Load
router.get('/:id', function(req, res){
    const key = datastore.key([LOAD, parseInt(req.params.id,10)]);
    
    datastore.get(key, (err, load) => {
            if (err) {
                console.error('There was an error', err);
                res.status(404).send({"Error":"No load with this load_id exists"});
                return;
            }
    queryData = {
            id: req.params.id,
            weight: load.weight,
            carrier: load.carrier,
            content: load.content,
            delivery_date: load.delivery_date,
            self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + key.id 
        };
        console.log("Router.get/load: returning data "+ JSON.stringify(queryData));
        res.status(200).json(queryData)
    });
});

//post route
router.post('/', function(req, res){
    if (!req.body.weight || !req.body.carrier || !req.body.content || !req.body.delivery_date ){
        res.status(400).send({"Error":"The request object is missing at least one of the required attributes"});
    }else{
    post_load(req.body)
    .then( key => {resData = {
        id: key.id,
        weight: req.body.weight,
        carrier: req.body.carrier.id,
        content: req.body.content,
        delivery_date: req.body.delivery_date,
        self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + key.id 
    };
    console.log("Router.post: posted load"+ JSON.stringify(resData)),
    res.status(201).send(resData)}).catch((err)=>{
        console.log('In router.post caught ' + err); 
            res.status(404).send();
    }); 
    }
});

//put route
router.put('/:id', function(req, res){
    put_guest(req.params.id, req.body.name)
    .then(res.status(200).end());
});

//delete route
router.delete('/:id', function(req, res){
    const l_key = datastore.key([LOAD, parseInt(req.params.id,10)]) 

// console.log (u)
u.check(l_key).then(
        load=>{

        //    console.log("load.carrier "+ Object.keys(load[0].carrier))
        //    console.log("load.carrier "+ load[0].carrier.id)
           
        //     console.log("load.carrier.id"+req.params.id)
        const loadID =  req.params.id  
        const carrierID = load[0].carrier.id
       //  if (load[0].carrier.id != null){
           
         // }else {
             u.dbl(carrierID, loadID).then()
             .then(res.status(204).end());
//         }

        }).catch((err)=>{
            console.log('In LOAD router.delete  caught ' + err); 
                res.status(404).send({"Error": "The specified load does not exist"});
        }); 
        
});

/* ------------- End Controller Functions ------------- */

module.exports = router;