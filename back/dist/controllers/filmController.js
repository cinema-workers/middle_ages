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
const sequelize_1 = require("sequelize");
const film_1 = require("../models/film");
const genre_1 = require("../models/genre");
const ITEMS_PER_PAGE = 4;
exports.getFilms = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = +req.query.page || 1;
        const offset = page === 1 ? 0 : page * ITEMS_PER_PAGE;
        const limitItems = offset ? ITEMS_PER_PAGE : ITEMS_PER_PAGE * 2;
        const films = yield film_1.Film.findAndCountAll({
            limit: limitItems,
            offset,
            include: { model: genre_1.Genre, through: { attributes: [] } },
            distinct: true,
        });
        if (!films.count) {
            throw new Error("Фильмы не найдены.");
        }
        res.status(200).json(films);
    }
    catch (e) {
        next(e);
    }
});
exports.getUpcomingFilms = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = +req.query.page || 1;
        const offset = page === 1 ? 0 : page * ITEMS_PER_PAGE;
        const limitItems = offset ? ITEMS_PER_PAGE : ITEMS_PER_PAGE * 2;
        const d = new Date();
        const date = d.getDate() > 9 ? d.getDate() : `0${d.getDate()}`;
        const month = d.getMonth() + 1 > 9 ? d.getMonth() + 1 : `0${d.getMonth() + 1}`;
        const year = d.getFullYear();
        const fullDate = `${year}-${month}-${date}`;
        const films = yield film_1.Film.findAndCountAll({
            where: { startDate: { [sequelize_1.Op.gte]: fullDate } },
            limit: limitItems,
            offset,
            include: genre_1.Genre,
            distinct: true,
        });
        if (!films.count) {
            throw new Error("Фильмы не найдены.");
        }
        res.status(200).json(films);
    }
    catch (e) {
        next(e);
    }
});
exports.getFilm = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const film = yield film_1.Film.findByPk(id, {
            include: { model: genre_1.Genre, through: { attributes: [] } },
            attributes: { exclude: ["createdAt", "updatedAt"] },
        });
        if (!film) {
            throw new Error("Фильм с таким ID не найден");
        }
        const end = new Date(film.endDate);
        const endYear = end.getUTCFullYear();
        const endDate = end.getUTCDate() > 9 ? end.getUTCDate() : `0${end.getUTCDate()}`;
        const endMonth = end.getUTCMonth() + 1 > 9
            ? end.getUTCMonth() + 1
            : `0${end.getUTCMonth() + 1}`;
        const e = `${endYear}-${endMonth}-${endDate}`;
        const start = new Date(film.startDate);
        const startYear = start.getUTCFullYear();
        const startDate = start.getUTCDate() > 9 ? start.getUTCDate() : `0${start.getUTCDate()}`;
        const startMonth = start.getUTCMonth() + 1 > 9
            ? start.getUTCMonth() + 1
            : `0${start.getUTCMonth() + 1}`;
        const s = `${startYear}-${startMonth}-${startDate}`;
        res.status(200).json(Object.assign(Object.assign({}, film.dataValues), { endDate: e, startDate: s }));
    }
    catch (e) {
        next(e);
    }
});
