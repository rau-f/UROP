import express from "express"
import pool from "../db.js"

const router = express.Router();


router.get('/', get_all_opportunities);
router.get('/:id', get_by_id);
router.post('/', create_opportunity);
router.delete('/:id', delete_by_id);
router.put('/:id', update_by_id);


async function get_all_opportunities(req, res) {
    try {
        const [rows] = await pool.query("SELECT * FROM opportunities;");
        return res.status(200).json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error!" });
    }
}


async function create_opportunity(req, res) {
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
}


async function get_by_id(req, res) {
    const id = req.params.id;
    let _id = Number(id);

    if (!Number.isInteger(_id))
        return res.status(400).json({ error: 'Invalid id type!' });
    if (_id < 1)
        return res.status(400).json({ error: 'ID value cannot be < 1' });

    try {
        const [row] = await pool.query("SELECT * FROM opportunities WHERE id = ?", [ id ]);
        if (row.length === 0)
            return res.status(404).json({ error: 'Record does not exist with that ID' });
        return res.status(200).json(row[0]);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}


async function delete_by_id(req, res) {
    const id = req.params.id;
    let _id = Number(id);

    if (!Number.isInteger(_id))
        return res.status(400).json({ error: 'Invalid id type!' });
    if (_id < 1)
        return res.status(400).json({ error: 'ID value cannot be < 1' });

    try {
        const [row] = await pool.execute("DELETE FROM opportunities WHERE id = ?", [ id ]);
        if (row.affectedRows === 0)
            return res.status(404).json({ error: 'Record does not exist with that ID' });
        return res.status(200).json(row);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}


async function update_by_id(req, res) {
    const id = req.params.id;
    let _id = Number(id);

    if (!Number.isInteger(_id))
        return res.status(400).json({ error: 'Invalid id type!' });
    if (_id < 1)
        return res.status(400).json({ error: 'ID value cannot be < 1' });

    const { title, description, area, researcher_name, department, 
        required_skills, available_positions, deadline, status } = req.body;

    if (!title || !area || !researcher_name || !department || !deadline)
        return res.status(400).json({ error: '1 or more required fields are missing!' });

    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormat.test(deadline))
        return res.status(400).json({ error: 'Invalid date format! Use YYYY-MM-DD' });

    let _deadline = new Date(deadline);
    if (isNaN(_deadline))
        return res.status(400).json({ error: 'Invalid date!' });
    if (_deadline.toISOString().slice(0, 10) !== deadline)
        return res.status(400).json({ error: "Entered date does not exist!" });

    let _available_positions = available_positions;
    if (!_available_positions)
        _available_positions = 0;
    else if (!Number.isInteger(_available_positions))
        return res.status(400).json({ error: 'available positions needs to be an integer!' });
    else if (_available_positions < 0)
        return res.status(400).json({ error: 'Invalid available positions count!' });

    let _status = status;
    if (Number.isInteger(_status))
        return res.status(400).json({ error: 'Invalid status type!' });
    if (!_status)
        _status = 'open';
    else {
        _status = _status.toLowerCase();
        if (_status !== 'open' && _status !== 'closed')
            return res.status(400).json({ error: 'Invalid status!' });
    }

    try {
        const [result] = await pool.execute(
            `UPDATE opportunities SET title = ?, description = ?, area = ?, researcher_name = ?, department = ?,
              required_skills = ?, available_positions = ?, deadline = ?, status = ? WHERE id = ?`, 
            [ title, description ?? null, area, researcher_name, department, required_skills ?? null, 
                _available_positions, deadline, _status, _id ]);

        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Record does not exist with that ID' });

        return res.status(200).json({ message: "Opportunity updated successfully!" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
}


export default router;