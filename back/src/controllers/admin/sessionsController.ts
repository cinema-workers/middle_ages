import { RequestHandler } from "express";
import { Op } from "sequelize";
import Film from "../../../models/film";
import Session from "../../../models/session";
import Genre from "../../../models/genre";

const ITEMS_PER_PAGE = 4;

// export const createSession = async (filmId: number, startDate:string, endDate:string, duration: string) => {

//     await Session.bulkCreate();
// }

const receiveFilms = async (start: Date, end: Date): Promise<Film[]> => {
  const films: Film[] = await Film.findAll({
    where: {
      [Op.or]: [
        {
          startDate: {
            [Op.between]: [start, end],
          },
        },
        {
          endDate: {
            [Op.between]: [start, end],
          },
        },
        {
          [Op.and]: [
            {
              startDate: {
                [Op.lt]: start,
              },
            },
            {
              endDate: {
                [Op.gt]: end,
              },
            },
          ],
        },
      ],
    },
    include: {
      model: Genre,
      attributes: { exclude: ["createdAt", "updatedAt"] },
      through: { attributes: [] },
    },
    attributes: {
      exclude: ["createdAt", "updatedAt", "description", "posterUrl"],
    },
    distinct: true,
  });
  return films;
};

const calculateTime = (start: Date) => {
  const hourOfStart =
    start.getUTCHours() < 10
      ? "0" + start.getUTCHours()
      : String(start.getUTCHours());
  const minOfStart =
    start.getUTCMinutes() < 10
      ? "0" + start.getUTCMinutes()
      : String(start.getUTCMinutes());
  const secOfStart =
    start.getUTCSeconds() < 10
      ? "0" + start.getUTCSeconds()
      : String(start.getUTCSeconds());
  return `${hourOfStart}:${minOfStart}:${secOfStart}`;
};

const oneFilmSchedule = (
  film: Film,
  start: Date,
  end: Date,
  scheduleArr: string[],
  filmEndsBeforeSchedule: Boolean = false
) => {
  const [hDur, mDur, sDur] = film.filmDuration.split(":");
  const arr = scheduleArr.map((el) => {
    const daySchedule = {
      [el]: [],
    };
    const scheduleDate = el.split("-")[2];
    const start = new Date(el);
    start.setUTCDate(+scheduleDate);
    start.setUTCHours(5, 0, 0, 0);
    if (filmEndsBeforeSchedule && start > film.endDate) {
      return daySchedule;
    }
    const end = new Date(el);
    end.setUTCDate(+scheduleDate);
    end.setUTCHours(23, 59, 59, 999);
    while (start < end) {
      const timeOfSessionStart = calculateTime(start);
      daySchedule[el].push({ [timeOfSessionStart]: film });
      start.setUTCHours(start.getUTCHours() + +hDur, +mDur + 15, +sDur);
    }
    daySchedule[el].pop();
    return daySchedule;
  });
  return arr;
};

const twoFilmsSchedule = (
  films: Film[],
  start: Date,
  end: Date,
  scheduleArr: string[]
) => {
  const arr = scheduleArr.map((el) => {
    const daySchedule = {
      [el]: [],
    };
    const scheduleDate = el.split("-")[2];
    const start = new Date(el);
    start.setUTCDate(+scheduleDate);
    start.setUTCHours(5, 0, 0, 0); //настроеная дата для каждого нового рабочего дня
    const adjustedFilms = films.map((film) => {
      //фильмы, с добавленными полями для проверки возраста и новый фильм или нет
      const [hDur, mDur, sDur] = film.dataValues.filmDuration.split(":");
      const d = new Date();
      d.setUTCHours(+hDur, +mDur + 15, +sDur);
      const totalDuration = calculateTime(d);
      const dateForOldCheck = new Date(film.dataValues.startDate);
      dateForOldCheck.setUTCDate(dateForOldCheck.getUTCDate() + 6);

      const fullDay = parseInt(film.dataValues.ageRestriction, 10) > 11;
      return {
        ...film.dataValues,
        totalDuration,
        isOld: dateForOldCheck <= start,
        fullDay,
      };
    });
    const end = new Date(el);
    end.setUTCDate(+scheduleDate);
    end.setUTCHours(23, 59, 59, 999); //настроенная дата для окончания рабочего дня
    if (adjustedFilms.every((film) => !film.isOld)) {
      let currentIdx = 0;
      const { length } = adjustedFilms;

      while (start < end) {
        const timeOfSessionStart = calculateTime(start);
        daySchedule[el].push({
          [timeOfSessionStart]: adjustedFilms[currentIdx],
        });
        const [hDur, mDur, sDur] =
          adjustedFilms[currentIdx].totalDuration.split(":");
        console.log(hDur, "hours");
        console.log(mDur, "minutes");
        console.log(start.getUTCHours(), 'hours');
        
        start.setUTCHours(start.getUTCHours() + +hDur, +mDur, +sDur); //добавляет некорректно для второго индекса время, вместо двух часов, так как это totalDuration, он добавляет 1.45
        console.log(start, "start");

        currentIdx = currentIdx + 1 === length ? 0 : currentIdx + 1;
      }
      daySchedule[el].pop();
    }
    return daySchedule;
  });
  return arr;
};
//1) проверить возрастное ограничение, если 0+ или 6+, то занимать первую половину дня, если оба 0+ или 6+, то чередовать весь день
//2) если оба фильма более чем 16+, то чередовать весь день
//3) если один из фильмов в прокате более недели и оба одних возрастных категорий, тогда чередование по сетке: два новых - один старый - два новых
//4) если старый фильм 0 или 6+, тогда показывать его только в период до 18.00 и с чередованием: два новых - один старый - два новых
//5) добавить три поля: isOldFilm, фильм, который в прокате на момент дня расписания уже более недели, isNewFilm, фильм в прокате на день расписания менее недели,
// и третье поле fullDay, если оба фильма 0 или 6+, то fullDay автоматически у обоих переставляется в true, если оба новые или оба старые, иначе новому проставляется fullDay: true, старому false
const prepareSchedule = (films: Film[], start: Date, end: Date) => {
  if (!films.length) {
    return "Нет фильмов в прокате на эти даты";
  }
  const weekSchedule: string[] = [];
  while (start < end) {
    const keyDate = start.toISOString().split("T")[0];
    weekSchedule.push(keyDate);
    start.setUTCDate(start.getUTCDate() + 1);
  }
  if (films.length === 1) {
    return films[0].dataValues.endDate > end
      ? oneFilmSchedule(films[0].dataValues, start, end, weekSchedule)
      : oneFilmSchedule(films[0].dataValues, start, end, weekSchedule, true);
  }
  if (films.length === 2) {
    return twoFilmsSchedule(films, start, end, weekSchedule);
  }
};

export const calculateSchedule: RequestHandler = async (req, res, next) => {
  const startSchedulePeriod = new Date();
  startSchedulePeriod.setUTCHours(0, 0, 0);
  startSchedulePeriod.setUTCDate(startSchedulePeriod.getUTCDate() + 6);
  const endSchedulePeriod = new Date();
  endSchedulePeriod.setUTCHours(23, 59, 59);
  endSchedulePeriod.setUTCDate(endSchedulePeriod.getUTCDate() + 12);
  const filmsToDistribute: Film[] = await receiveFilms(
    startSchedulePeriod,
    endSchedulePeriod
  );
  const schedule = prepareSchedule(
    filmsToDistribute,
    startSchedulePeriod,
    endSchedulePeriod
  );
  res.status(200).json(schedule);
};
