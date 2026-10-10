import express from "express"
import pool from "../db.js"

const router = express.Router();


router.get('/', async(req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM opportunities;");
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error!" });
    }
});


router.post('/', async (req, res) => {
    const opp = {
        title:          req.body.title,
        desc:           req.body.description,
        area:           req.body.area,
        rsrchr_name:    req.body.researcher_name,
        dep:            req.body.department,
        rqrd_skills:    req.body.required_skills,
        avail_pos:      req.body.available_positions,
        deadline:       req.body.deadline,
        status:         "Open"
    };

    if (!opp.title || !opp.area || !opp.rsrchr_name || !opp.dep || !opp.avail_pos || !opp.deadline)
        res.status(400).json({ error: "1 or more requried fields are missing!"});

    try {
        await pool.execute(`INSERT INTO opportunities (
            title, 
            description, 
            area, 
            researcher_name, 
            department, 
            required_skills, 
            available_positions, 
            deadline, 
            status)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [opp.title, opp.desc, opp.area, opp.rsrchr_name, opp.dep, 
                opp.rqrd_skills, opp.avail_pos, opp.deadline, opp.status]);
        
        res.status(200).json()
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error!" });
    }
});