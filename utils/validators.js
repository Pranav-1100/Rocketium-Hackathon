export const validateImage = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            error: {
                message: 'No image file provided',
                status: 400
            }
        });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
            error: {
                message: 'Invalid file type. Only JPEG, PNG, and GIF are allowed',
                status: 400
            }
        });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
        return res.status(400).json({
            error: {
                message: 'File size too large. Maximum size is 10MB',
                status: 400
            }
        });
    }

    next();
};

export const validatePRD = (req, res, next) => {
    const { prd } = req.body;

    if (!prd) {
        return res.status(400).json({
            error: {
                message: 'PRD is required',
                status: 400
            }
        });
    }

    // Add any specific PRD validation rules here
    // Example: required fields, format validation, etc.

    next();
};
