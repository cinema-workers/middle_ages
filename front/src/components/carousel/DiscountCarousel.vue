<script setup lang="ts">
import DiscountCarouselItem from "./DiscountCarouselItem.vue";
import { reactive, onBeforeMount, ref, Ref, computed } from "vue";
import { Discount } from "@/interfaces/models";
import { axiosInstance as axios } from "../../utils/axios";
import BaseSubheader from "../UI/BaseSubheader.vue";

type mode = "inc" | "dec";
interface DiscountsFromDB {
  discounts: Discount[];
  count: number;
}

const discounts: { value: Discount[] } = reactive({ value: [] });
const discountsToShow: { value: Discount[] } = reactive({ value: [] });
let totalDiscountsAmt: Ref<number> = ref(0);
let page = ref(1);

let isLastPage = computed(() => {
  console.log(page.value * 4 >= totalDiscountsAmt.value, "is last page");

  return page.value * 4 >= totalDiscountsAmt.value;
});
let allDiscountsReceived = computed(() => {
  return totalDiscountsAmt.value === discounts.value.length;
});

onBeforeMount(async () => {
  const res: DiscountsFromDB = await getDiscounts(page.value);

  if (res.count) {
    ({ discounts: discounts.value, count: totalDiscountsAmt.value } = res);
  }
  if (discounts.value.length > 4) {
    discountsToShow.value = discounts.value.slice(0, 4);
  } else {
    discountsToShow.value = discounts.value.slice(0);
  }
});
const getDiscounts = async (page: number) => {
  try {
    const response = await axios.get(`discounts?page=${page}`);
    if (response?.data?.count) {
      return response.data;
    } 
    return { discounts: [], count: 0 }
  } catch (e) {
    console.log(e);
    return { discounts: [], count: 0 }
  }
};

function changePage(mode: mode) {
  mode === "inc" ? page.value++ : page.value--;
  carouselControl();
}

const carouselControl = async () => {
  if (allDiscountsReceived.value) {
    discountsToShow.value = discounts.value.slice(
      (page.value - 1) * 4,
      page.value * 4
    );
  } else if (page.value === 1) {
    discountsToShow.value = discounts.value.slice(0, 4);
  } else {
    const res: DiscountsFromDB = await getDiscounts(page.value);
    if (
      res.count &&
      !discounts.value.find((d) => res.discounts.some((v) => v.id === d.id))
    ) {
      res.discounts.forEach((d) => discounts.value.push(d));
    }
    discountsToShow.value = discounts.value.slice(
      (page.value - 1) * 4,
      page.value * 4
    );
  }
};
</script>

<template>
  <section v-if="discounts.value.length" class="current-discounts__container">
    <BaseSubheader
      subtitle="Акции"
      :all-data-received="allDiscountsReceived"
      :is-last-page="isLastPage"
      :page="page"
      @next-page="changePage('inc')"
      @prev-page="changePage('dec')"
    ></BaseSubheader>
    <div class="discount-carousel">
      <DiscountCarouselItem
        v-for="discount in discountsToShow.value"
        :key="JSON.stringify(discount)"
        :url="discount.posterUrl"
        :name="discount.name"
        :description="discount.description"
        :discount-percentage="String(discount.discountPercentage)"
      >
      </DiscountCarouselItem>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.current-discounts__container {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  .discount-carousel {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    padding: 10px 5px;
    border-radius: 0.5rem;
    box-shadow: 0 4px 15px #88b8fe;
    div {
      transition: opacity 0.6s ease;
    }
    &:hover div {
      opacity: 0.5;
    }
    div:hover {
      opacity: 1;
    }
  }
}
</style>
