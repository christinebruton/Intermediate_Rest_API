const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const ds = require('./datastore');

const datastore = ds.datastore;

const GUEST = "Guest";
const LOAD  = "Load"

router.use(bodyParser.json());


/* ------------- Begin guest Model Functions ------------- */
function post_guest(name, description, price){
    var key = datastore.key(GUEST);
	const new_guest = {"name": name};
	return datastore.save({"key":key, "data":new_guest}).then(() => {return key});
}

/************************ POST HELPER FUNCTIONS******************************/
async function post_guest(name, ){
    var key = datastore.key(LOAD);
	const new_load = {"weight": name, "carrier": boat_id, "content":content, "delivery_date": delevery_date};
	await datastore.save({ "key": key, "data": new_load });
    return key;
}


/************************ GET HELPER FUNCTIONS******************************/



function get_guests(req){
    var q = datastore.createQuery(GUEST).limit(2);
    const results = {};
    var prev;
    if(Object.keys(req.query).includes("cursor")){
        prev = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + req.query.cursor;
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
            results.items = entities[0].map(ds.fromDatastore);
            if(typeof prev !== 'undefined'){
                results.previous = prev;
            }
            if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){ //see if there are more results
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
            }
			return results;
		});
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

router.get('/', function(req, res){
    const guests = get_guests(req)
	.then( (guests) => {
        res.status(200).json(guests);
    });
});

router.post('/', function(req, res){
    post_guest(req.body.name)
    .then( key => {res.status(200).send('{ "id": ' + key.id + ' }')} );
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