
const mongoose = require('mongoose');
function generateUniqueId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const empSchema = new mongoose.Schema({
    empId: { type: String, unique: true, required: true, default: generateUniqueId }, // Custom 4-character unique ID
    f_Name: { type: String, required: true },
    f_Email: { type: String, required: true, unique: true },
    f_Mobile: { type: String, required: true },
    f_Designation: { type: String, required: true },
    f_Gender: { type: String, required: true },
    f_Courses: { type: [String], required: true }, 
    createddate: { type: String, required: true }, 
    profile: { type: String, required: true }

});

empSchema.pre('save', async function(next) {
    if (!this.empId) {
        let isUnique = false;
        while (!isUnique) {
            const tempId = generateUniqueId();
            const existingEmployee = await mongoose.model('t_employee').findOne({ empId: tempId });
            if (!existingEmployee) {
                this.empId = tempId;
                isUnique = true;
            }
        }
    }
    next();
});

module.exports = mongoose.model('t_employee', empSchema);
