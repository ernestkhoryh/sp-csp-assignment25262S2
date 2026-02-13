const validator=require('validator');

const validateInsertion=function(req,res,next){

        var username = req.body.username;
        var email = req.body.email;
        var password = req.body.password;
        var role = req.body.role;

        var usernamePattern=/^[a-zA-Z0-9]+$/;
        var emailPattern=/^.+@.+\..+$/;//abc@xyz.com
        var passwordPattern=/^[a-zA-Z0-9]{8,}$/;

        // In your validation (more permissive)
// var passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if(usernamePattern.test(username) && validator.isEmail(email) && passwordPattern.test(password)
            && (role=="admin" || role=="user")){

                next();
            }else{
                res.status(500);
                res.type('json');
                res.send(`{"Message":"Invalid data"}`);
            }
    }

const validateIntID = function(paramName) {
        return function(req, res, next) {
            const id = req.params[paramName];
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    error: 'Invalid ID',
                    message: `${paramName} must be a valid integer`
                });
            }
            
            // Convert to integer and attach to request
            req.params[paramName] = parseInt(id);
            next();
        };

    }



module.exports={
    validateInsertion:validateInsertion,
    validateIntID:validateIntID
};