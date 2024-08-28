const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username:{type: String, required: true},
  location:{type:String, required: false},
  password: { type: String, required: true }

});

userSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);