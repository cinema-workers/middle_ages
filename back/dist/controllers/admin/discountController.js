"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discount_1 = require("../../models/discount");
exports.createDiscount = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const discountData = req.body;
    if (!req.file) {
        const error = new Error("No image provided.");
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    const discount = yield discount_1.Discount.create({
        name: discountData.name,
        ageRestriction: discountData.ageRestriction,
        posterUrl: imageUrl,
        description: discountData.description,
        discountPercentage: discountData.discountPercentage,
    });
    res
        .status(201)
        .json({ message: "Discount added.", createdDiscount: discount });
});
