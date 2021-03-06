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
const discount_1 = require("../models/discount");
const ITEMS_PER_PAGE = 4;
exports.getDiscounts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const page = +req.query.page || 1;
    const offset = page === 1 ? 0 : page * ITEMS_PER_PAGE;
    const limitItems = offset ? ITEMS_PER_PAGE : ITEMS_PER_PAGE * 2;
    const discounts = yield discount_1.Discount.findAndCountAll({
        limit: limitItems,
        offset,
    });
    if (!discounts.count) {
        res.status(200).json("Акции не найдены.");
    }
    res.status(200).json(discounts);
});
