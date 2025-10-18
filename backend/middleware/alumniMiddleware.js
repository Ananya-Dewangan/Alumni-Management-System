// Middleware to check if the user is an alumni

export const alumniOnly = (req, res, next) => {

  
  if (req.user.role !== "alumni") {
      
      return res.status(403).json({ msg: "Access denied: Alumni only" });
    }
    next();
  };
  