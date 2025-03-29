const Group = require('../Model/groupSchema');
const Users = require('../Model/groupSchema')
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

exports.groupInfo = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch group details and populate groupMembers with username and createdBy with username
        const group = await Group.findById(id)
            .populate({
                path: 'groupMembers',
                select: 'username', // Only select username
            })
            .populate({
                path: 'createdBy',
                select: 'username', // Fetch createdBy username
            })
            .exec();

        if (!group) {
            return res.status(400).json({ message: 'Group not found' });
        }

        res.status(200).json({
            groupName: group.name,
            createdBy: group.createdBy.username, // Get the username of the creator
            groupIcon: group.groupIcon,
            groupMembersId:group.groupMembers,
            groupMessages: group.groupMessages,
            
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateMembers = async (req, res) => {
    try {
        const { id } = req.params; // Logged-in user ID from params
        const { userId, groupId } = req.body;

        // Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(401).json({ message: 'Group not found' });
        }
        // Check if the logged-in user is the creator of the group
        if (id !== group.createdBy.toString()) {
            return res.status(400).json({ message: 'Unauthorized: Only the group creator can add members' });
        }
        // Update the groupMembers array
        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            { $addToSet: { groupMembers: userId } }, // Ensures no duplicate members
            { new: true }
        ).populate({ path: 'groupMembers', select: 'username' });

        res.status(200).json({
            message: 'User added successfully',
            groupMembers: updatedGroup.groupMembers.map(member => member.username),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.removeUser = async (req, res) => {
    try {
      const { id } = req.params; // Logged-in user ID from params
      const { userId, groupId } = req.body;
  
      // Find the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(401).json({ message: 'Group not found' });
      }
  
      // Check if the logged-in user is the creator of the group
      if (id !== group.createdBy.toString()) {
        return res.status(400).json({ message: 'Unauthorized: Only the group creator can remove members' });
      }
  
      // Remove user from the groupMembers array
      const updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        { $pull: { groupMembers: userId } },
        { new: true }
      ).populate({ path: 'groupMembers', select: 'username' });
  
      res.status(200).json({
        message: 'User removed successfully',
        groupMembers: updatedGroup.groupMembers.map(member => member.username),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  exports.removeGroup = async (req, res) => {
    try {
      const { id } = req.params; // Logged-in user ID from params
      const { groupId } = req.body;
  
      // Find the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(401).json({ message: 'Group not found' });
      }
  
      // Check if the logged-in user is the creator of the group
      if (id !== group.createdBy.toString()) {
        return res.status(400).json({ message: 'Unauthorized: Only the group creator can delete the group' });
      }
  
      // Delete the group
      await Group.findByIdAndDelete(groupId);
  
      res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.clearGroupChat = async (req, res) => {
    try {
      const { id } = req.params; // Logged-in user ID from params
      const { groupId } = req.body;
  
      // Find the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
  
      // Check if the logged-in user is the creator of the group
      if (id !== group.createdBy.toString()) {
        return res.status(403).json({ message: 'Unauthorized: Only the group creator can clear messages' });
      }
  
      // Clear group messages
      group.groupMessages = [];
      await group.save();
  
      res.status(200).json({ message: 'Group chat cleared successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  