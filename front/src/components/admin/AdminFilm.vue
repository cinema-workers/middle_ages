<script setup lang="ts">

import { SnackType } from "@/interfaces/types";
import { Film, Genre } from "@/interfaces/models";
import { FilmResponse, SavedPosterResponse } from '@/interfaces/responses'
import { axiosInstance as axios } from "../../utils/axios";
import { reactive, onBeforeMount, ref, onMounted, Ref, computed } from "vue";
import BaseSnack from "../UI/BaseSnack.vue";
import ImageUploader from './ImageUploader.vue';


const successText = "Фильм успешно добавлен";
const failureText = "Проблема при сохранении фильма";
const textToDisplay = computed(() =>
  mode.value === "error" ? failureText : successText
);
let mode: Ref<SnackType> = ref("error");
let snackIsVisible = ref(false);

let film: Film = reactive({
  name: "",
  ageRestriction: "",
  posterUrl: "",
  startDate: "",
  description: "",
  filmDuration: "",
  basePrice: 500,
  genres: [],
  endDate: "",
});
let genres: { value: Genre[] } = reactive({ value: [] });

onBeforeMount(async () => {
  genres.value = await getGenres();
});

const descriptionRef = ref<HTMLElement | null>(null);

async function createFilm() {
  const posterData = new FormData();
  posterData.append("posterUrl", film.posterUrl);
  try {
    const savedPoster:SavedPosterResponse = await axios.post(
      "http://localhost:3000/admin/poster",
      posterData,
    );
    
    if (savedPoster.data.status === 201) {
      const addedFilm:FilmResponse = await axios.post(
        "http://localhost:3000/admin/film",
        { ...film, posterUrl: savedPoster.data.url }
      );
      mode.value = addedFilm.data?.id ? "success" : "error";
    } else {
      mode.value = "error";
    }
    snackIsVisible.value = true;
    setTimeout(() => (snackIsVisible.value = false), 4000);
  } catch (e) {
    mode.value = "error";
    snackIsVisible.value = true;
    setTimeout(() => (snackIsVisible.value = false), 4000);
    console.log(e);
  }
}

async function getGenres(): Promise<Genre[] | []> {
  const headers = {
    "Access-Control-Allow-Origin": "*",
  };
  try {
    const response = await axios.get("admin/genres", {
      headers,
    });
    return response?.data ? reactive(response.data) : reactive([]);
  } catch (e) {
    console.log(e);
    return [];
  }
}
onMounted(() => {
  descriptionRef.value?.focus();
});

const resize = () => {
  if (descriptionRef.value) {
    descriptionRef.value.style.height = "1rem";
    descriptionRef.value.style.height =
      descriptionRef.value.scrollHeight + "px";
  }
};
</script>
<template>
  <form class="base-form" @submit.prevent>
    <div class="base-form__row">
      <h1>Добавление фильма</h1>
    </div>
    <div class="base-form__row">
      <div class="base-form__input">
        <input type="text" id="name" required v-model="film.name" />
        <label for="name" class="">Название фильма</label>
      </div>
      <div class="base-form__input">
        <input
          type="text"
          id="ageRestriction"
          required
          v-model="film.ageRestriction"
        />
        <label for="ageRestriction" class="">Возрастное ограничение</label>
      </div>
    </div>
    <div class="base-form__row">
      <ImageUploader :film="film" :order="1"></ImageUploader>

      <select class="select-genres" multiple v-model="film.genres">
        <option v-for="genre in genres.value" :key="genre.name" :value="genre">
          {{ genre.name }}
        </option>
      </select>
    </div>
    <div class="base-form__row">
      <div class="base-form__input base-form__input--date">
        <input
          type="date"
          min="2022-01-01"
          max="2050-12-31"
          id="startDate"
          v-model="film.startDate"
        />
        <label for="startDate" class="">Дата начала проката</label>
      </div>
      <div class="base-form__input base-form__input--date">
        <input
          type="date"
          min="2022-01-01"
          max="2050-12-31"
          id="endDate"
          v-model="film.endDate"
        />
        <label for="endDate" class="">Дата окончания проката</label>
      </div>
    </div>
    <div class="base-form__row">
      <div class="base-form__input">
        <input type="text" id="basePrice" required v-model="film.basePrice" />
        <label for="basePrice" class="">Базовая стоимость</label>
      </div>
      <div class="base-form__input">
        <input type="text" id="duration" required v-model="film.filmDuration" />
        <label for="duration" class=""
          >Продолжительность фильма, формат: чч:мм:сс</label
        >
      </div>
    </div>
    <div class="base-form__row">
      <div class="base-form__input base-form__input--description">
        <textarea
          id="description"
          ref="descriptionRef"
          @input="resize"
          class="base-form__input--area"
          v-model="film.description"
          placeholder="Введите описание фильма"
        ></textarea>
        <label for="description" class="">Описание фильма</label>
      </div>
      <ImageUploader :film="film" :order="2"></ImageUploader>
      <button class="save-button" @click="createFilm">SAVE FILM</button>
    </div>
    <BaseSnack
      v-if="snackIsVisible"
      :text="textToDisplay"
      :mode="mode"
    ></BaseSnack>
  </form>
</template>

<style lang="scss" scoped>
@import "@/assets/styles/date-input.scss";
@import "@/assets/styles/base-form.scss";
@import "@/assets/styles/base-button.scss";
form {
  position: relative;
}
.select-genres {
  border-radius: 1.25rem;
  padding: 1rem;
  border: 1px solid #ced4da;
  box-shadow: 0 4px 7px #88b8fe;
  &:focus {
    box-shadow: 0 0 0 4px rgba(#88b8fe, 0.25);
  }
  &:focus-visible {
    outline: none;
  }
  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    background-color: transparent;
    border-radius: 10px;
  }

  &::-webkit-scrollbar {
    width: 20px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background-color: #88b8fe;
  }

  option {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    &:focus,
    &:checked {
      background-color: rgba(#88b8fe, 0.25);
      color: #000;
      border-radius: 1.25rem;
    }
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px rgba(#88b8fe, 0.25);
    }
  }
}

.base-form__input {
  &--description {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
  &--date {
    & input {
      height: 100% !important;
    }
  }
  &--area {
    box-shadow: 0 4px 15px #88b8fe;
    min-height: 5rem;
    &::-webkit-scrollbar-track {
      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
      -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
      background-color: transparent;
      border-radius: 4px;
    }

    &::-webkit-scrollbar {
      width: 5px;
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 4px;
      background-color: #88b8fe;
    }
  }
}
.save-button {
  height: 2rem;
  width: 10rem;
  margin: 0 auto;
}
.base-form__row {
  &:first-child {
    grid-template-columns: 1fr;
    justify-items: center;
    h1 {
      font-size: 2rem;
    }
  }
  &:last-child {
    align-items: center;
  }
}
</style>
