const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    groupIcon: {
      type: String,
      default:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHd26dvClIXeNbaHibs6NG8PiZRNuFyjyLHw&s"
    },
    groupMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
      }
    ],
    groupMessages: [groupMessageSchema]
  },
  { timestamps: true }
);

const Group = mongoose.model("groups", groupSchema);
module.exports = Group;
