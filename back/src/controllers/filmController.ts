import { RequestHandler } from "express";
import Film from '../../models/film';
import Genre from '../../models/genre';

const ITEMS_PER_PAGE = 4;
interface FilmsFromDB {
    rows: Film[];
}
interface FilmsForVue {
    films: FilmsFromDB,
    isLast: Film
}
export const getFilms: RequestHandler = async (req, res, next) => {
    const page:number = req.query.page ? +req.query.page : 0;
    const offset: number = page ? page * ITEMS_PER_PAGE : 0;
    const films:FilmsFromDB = await Film.findAll({ limit: ITEMS_PER_PAGE, offset, include: Genre });
    // if (!films.length) {
    //     res.status(200).json('Фильмы не найдены.');
    // }
    const { film?.dataValues?.id: lastFilmId } = await Film.findOne({ order: [ [ 'id', 'DESC' ]] });
    const isLast = films.find(film => film.id === lastFilmId);
    const response: FilmsForVue = { films, isLast };
    
    res.status(200).json(response)
}

export const getFilm: RequestHandler = async (req, res, next) => {
    const id = req.params.id;
    const film = await Film.findByPk(id);
    if (!film) {
        throw new Error('Фильм с таким ID не найден');
    }
    res.status(200).json({ film });
}