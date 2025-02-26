const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');

//@desc    Get all hospitals
//@route   GET /api/v1/hospitals
//@access  Public
exports.getHospitals = async (req, res) => {
    let query;
    
    //copy req.query
    const reqQuery = {...req.query};

    //Feild to exclude
    const removeFields = ['select','sort','page','limit'];

    //loop over remove removed feild and deleted them
    removeFields.forEach(param=>delete reqQuery[param]);
    console.log(reqQuery);

    //create query string
    let queryStr= JSON.stringify(reqQuery) ;

    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    //finding resourse
    query = Hospital.find(JSON.parse(queryStr)).populate('appointments');

    //select
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }
    //sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }
    //pagination
    const page = parseInt(req.query.page,10) || 1;
    const limit = parseInt(req.query.limit,10) || 25;
    const startIndex = (page-1)*limit;
    const endIndex = page*limit;
     
    try{
        const total = await Hospital.countDocuments();
        query = query.skip(startIndex).limit(limit);
        
        //Execute query
        const hospitals = await query;
        
        //pagination result
        const pagination = {};

        if(endIndex<total){
            pagination.next = {
                page:page+1,
                limit
            }
        }
        if(startIndex>0){
            pagination.prev = {
                page:page-1,
                limit
            }
        }

        res.status(200).json({success:true, count:hospitals.length, pagination, data:hospitals});
    }
    catch(err){
        res.status(400).json({success:false});
    }
};

//@desc    Get single hospital
//@route   GET /api/v1/hospitals/:id
//@access  Public
exports.getHospital = async (req, res) => {
    try{
        const hospital = await Hospital.findById(req.params.id);

        if(!hospital){
            return res.status(400).json({success:false});
        }
        
        res.status(200).json({success:true, data:hospital});
    }
    catch(err){
        res.status(400).json({success:false});
    }
};

//@desc    Create new hospital
//@route   POST /api/v1/hospitals
//@access  Private
exports.createHospital = async(req, res) => {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ success:true, data:hospital});
};
// exports.createHospital = (req, res, next) => {
//     console.log("Received Data:", req.body);  // Debugging line
//     res.status(201).json({ success: true, data: req.body });
// };

//@desc    Update hospital
//@route   PUT /api/v1/hospitals/:id
//@access  Private
exports.updateHospital = async (req, res) => {
    try{
        const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if(!hospital){
            res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:hospital});

    }catch(err){
        res.status(400).json({success:false});
    }
};

//@desc    Delete hospital
//@route   DELETE /api/v1/hospitals/:id
//@access  Private
exports.deleteHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        // ✅ Stop execution if hospital doesn't exist
        if (!hospital) {
            return res.status(400).json({ success: false, message: `Hospital not found with id of ${req.params.id}` });
        }

        // ✅ Delete related appointments
        await Appointment.deleteMany({ hospital: req.params.id });

        // ✅ Delete hospital
        await Hospital.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, data: {} });

    } catch (err) {
        console.error("Error deleting hospital:", err); // Debugging info
        res.status(500).json({ success: false, message: "Server error while deleting hospital", error: err.message });
    }
};
