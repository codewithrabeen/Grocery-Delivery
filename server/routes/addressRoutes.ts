

import express from "express";
import auth from "../middleware/auth.js";
import { addAddresses, deleteAddresses, getAddresses, updateAddresses } from "../controllers/addressController.js";
import { validateBody } from "../middleware/validate.js";
import { addressSchema } from "../schemas/apiSchemas.js";

const addressRouter = express.Router()
addressRouter.get('/', auth, getAddresses)
addressRouter.post('/', auth, validateBody(addressSchema), addAddresses)
addressRouter.put('/:id', auth, validateBody(addressSchema), updateAddresses)
addressRouter.delete('/:id', auth, deleteAddresses)

export default addressRouter
