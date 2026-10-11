import express from "express"
import pool from "../db.js"

const router = express.Router();


router.get('/', async(req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM opportunities;");
        return res.status(200).json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error!" });
    }
});


router.post('/', async (req, res) => {
    const { title, description, area, researcher_name, department, 
        required_skills, available_positions, deadline, status } = req.body;

    if (!title || !area || !researcher_name || !department || !deadline)
        return res.status(400).json({ error: '1 or more requried fields are missing!'});

    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormat.test(deadline))
        return res.status(400).json({ error: 'Invalid date format! use YYYY-MM-DD'});

    let _deadline = new Date(deadline);
    if (isNaN(_deadline))
        return res.status(400).json({ error: 'Invalid date!'});
    if (_deadline.toISOString().slice(0, 10) !== deadline)
        return res.status(400).json({ error: "Entered date does not exist!"});

    let _available_positions = available_positions;
    if (!_available_positions)
        _available_positions = 0;
    else if (!Number.isInteger(_available_positions))
        return res.status(400).json({ error: 'available positions needs to be an integer!'});
    else if (_available_positions < 0)
        return res.status(400).json({ error: 'Invalid available positions count!'});
    let _status = status;
    if (Number.isInteger(_status))
        return res.status(400).json({ error: 'Invalid status type!'});
    if (!_status)
        _status = 'open';
    else {
        _status = _status.toLowerCase();
        
        if (_status !== 'open' && _status !== 'closed')
            return res.status(400).json({ error: 'Invalid status!'});
    }

    try {
        const createdOpp = await pool.execute(`INSERT INTO opportunities (title, description, area, researcher_name, 
            department, required_skills, available_positions, deadline, status)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [title, description ?? null, area, researcher_name, department, 
                required_skills ?? null, _available_positions, deadline, _status]);
        
        return res.status(201).json(createdOpp);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
});


export default router;