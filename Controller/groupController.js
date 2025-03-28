const Group = require('../Model/groupSchema');
const mongoose = require('mongoose');


// Create a new group
exports.createGroup = async (req, res) => {
    try {
        const { name, userId, groupMember } = req.body;

        // Ensure groupMember is an array and contains at least one member
        if (!Array.isArray(groupMember) || groupMember.length === 0) {
            return res.status(400).json({ message: 'At least one group member is required' });
        }

        // Convert each group member ID to an ObjectId
        const groupMembersArray = groupMember.map(id => new mongoose.Types.ObjectId(id));

        // Create new group
        const newGroup = new Group({
            name,
            createdBy: new mongoose.Types.ObjectId(userId),
            groupMembers: groupMembersArray,
        });

        await newGroup.save();
        res.status(200).json({ message: 'Group created successfully', group: newGroup });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserGroups = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Missing user ID' });
        }

        const groups = await Group.find({
            $or: [
                { createdBy: id },
                { groupMembers: id }
            ]
        });

        res.status(200).json({ message: 'Successful', groups });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
