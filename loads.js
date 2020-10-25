const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const ds = require('./datastore');

const datastore = ds.datastore;

const GUEST = "Guest";
const LOAD  = "Load"

router.use(bodyParser.json());


/* ------------- Begin guest Model Functions ------------- */

/************************ POST HELPER FUNCTIONS******************************/

function post_load(loadObj){
    var key = datastore.key(LOAD);
	const new_load = {"weight": loadObj.weight, "carrier": loadObj.carrier, "content": loadObj.content,"delivery_date": loadObj.delivery_date};
	return datastore.save({"key":key, "data":new_load}).then(() => {return key});
}


function add_load_carrier(b_id, l_id){
    const l_key = datastore.key([LOAD, parseInt(l_id,10)]);

    datastore.get(l_key, (err, load) =>{
        if (load.carrier == null){
            // load.carrier = b_id;
            const new_load = {"weight": load.weight, "carrier": b_is, "content": load.content,"delivery_date": load.delivery_date};
            // return datastore.save({"key":l_key, "data":new_load}).then(() => {return key});
            return datastore.save({"key":l_key, "data":new_load})
        }else {
            res.status(403).send({"Error":"The load is not empty"})
           throw error; 
        }
    })
	// const new_load = {"weight": loadObj.weight, "carrier": loadObj.carrier, "content": loadObj.content,"delivery_date": loadObj.delivery_date};
	
}



/************************ GET HELPER FUNCTIONS******************************/

// function get_guests(req){
//     var q = datastore.createQuery(GUEST).limit(2);
//     const results = {};
//     var prev;
//     if(Object.keys(req.query).includes("cursor")){
//         prev = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + req.query.cursor;
//         q = q.start(req.query.cursor);
//     }
// 	return datastore.runQuery(q).then( (entities) => {
//             results.items = entities[0].map(ds.fromDatastore);
//             if(typeof prev !== 'undefined'){
//                 results.previous = prev;
//             }
//             if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){ //see if there are more results
//                 results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
//             }
// 			return results;
// 		});
// }


async function get_loads(req){
    var q = datastore.createQuery(LOAD).limit(3);
    const results = {};
    var prev;
    if(Object.keys(req.query).includes("cursor")){
        prev = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + req.query.cursor;
        q = q.start(req.query.cursor);
    }
	const entities = await datastore.runQuery(q);
    results.items = entities[0].map(ds.fromDatastore);
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

// router.get('/', function(req, res){
//     const guests = get_guests(req)
// 	.then( (guests) => {
//         res.status(200).json(guests);
//     });
// });


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
        console.log(queryData);
        res.status(200).json(queryData)
    });
});

router.post('/', function(req, res){
    console.log("body"+ JSON.stringify(req.body))
    if (!req.body.weight || !req.body.carrier || !req.body.content || !req.body.delivery_date ){
        res.status(400).send({"Error":"The request object is missing at least one of the required attributes"});
    }
    post_load(req.body)
    .then( key => {resData = {
        id: key.id,
        weight: req.body.weight,
        carrier: req.body.carrier.id,
        content: req.body.content,
        delivery_date: req.body.delivery_date,
        self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + key.id 
    };
    res.status(201).send(resData)});
});

router.put('/:id', function(req, res){
    put_guest(req.params.id, req.body.name)
    .then(res.status(200).end());
});

router.delete('/:id', function(req, res){
    delete_guest(req.params.id).then(res.status(200).end())
});

/* ------------- End Controller Functions ------------- */

module.exports = router;