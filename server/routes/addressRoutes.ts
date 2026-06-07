

import express from "express";
import auth from "../middleware/auth.js";
import {addAddresses, deleteAddresses, getAddresses, updateAddresses } from "../controllers/addressController.js";

const addressRouter = express.Router()
addressRouter.get('/', auth, getAddresses)
addressRouter.post('/', auth, updateAddresses)
addressRouter.put('/:id', auth, addAddresses)
addressRouter.delete('/:id', auth, deleteAddresses)

export default addressRouter