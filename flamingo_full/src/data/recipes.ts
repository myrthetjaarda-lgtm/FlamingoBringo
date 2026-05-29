import satayImg from "@/assets/recipe-satay.jpg";
import watermelonImg from "@/assets/recipe-watermelon.jpg";
import halloumiImg from "@/assets/recipe-halloumi.jpg";
import jalapenoImg from "@/assets/recipe-jalapeno.jpg";
import pastaImg from "@/assets/recipe-pasta.jpg";
import lemonadeImg from "@/assets/recipe-lemonade.jpg";
import cornImg from "@/assets/recipe-corn.jpg";

export type RecipeCategory =
  | "BBQ"
  | "Vegetarian BBQ"
  | "Vegan BBQ"
  | "Salads"
  | "Desserts"
  | "Marinades"
  | "Dips"
  | "Cocktails"
  | "Snacks"
  | "Picnic";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  image: string;
  description: string;
  category: RecipeCategory;
  difficulty: Difficulty;
  prepMinutes: number;
  servings: number; // base servings
  labels: string[];
  ingredients: string[];
  url: string;
  addedBy: { name: string; emoji: string };
  votes: number;
  claimedBy?: string;
  favorite?: boolean;
}

export const recipes: Recipe[] = [
  {
    id: "r1",
    title: "Chicken Satay",
    emoji: "🍢",
    image: satayImg,
    description: "Indonesian classic — peanut-marinated chicken skewers with a smoky char.",
    category: "BBQ",
    difficulty: "Medium",
    prepMinutes: 40,
    servings: 4,
    labels: ["High-protein", "Gluten-free"],
    ingredients: ["Chicken thigh", "Peanut butter", "Soy sauce", "Garlic", "Lime", "Skewers"],
    url: "https://smaakmenutie.nl/sate-ajam/",
    addedBy: { name: "Community", emoji: "🦩" },
    votes: 14,
  },
  {
    id: "r2",
    title: "Jalapeño Poppers",
    emoji: "🌶️",
    image: jalapenoImg,
    description: "Cream cheese stuffed peppers, crispy on the outside, melty inside.",
    category: "Snacks",
    difficulty: "Easy",
    prepMinutes: 25,
    servings: 6,
    labels: ["Vegetarian", "Spicy"],
    ingredients: ["Jalapeños", "Cream cheese", "Cheddar", "Breadcrumbs", "Bacon (optional)"],
    url: "https://www.allrecipes.com/recipe/20858/best-ever-jalapeno-poppers/",
    addedBy: { name: "Community", emoji: "🦩" },
    votes: 11,
    favorite: true,
  },
  {
    id: "r3",
    title: "Grilled Watermelon & Feta",
    emoji: "🍉",
    image: watermelonImg,
    description: "Char-grilled watermelon, salty feta, fresh mint — peak summer.",
    category: "Salads",
    difficulty: "Easy",
    prepMinutes: 15,
    servings: 4,
    labels: ["Vegetarian", "Gluten-free", "Refreshing"],
    ingredients: ["Watermelon", "Feta", "Mint", "Olive oil", "Lime"],
    url: "https://www.bbcgoodfood.com/recipes/watermelon-feta-mint-salad",
    addedBy: { name: "Community", emoji: "🦩" },
    votes: 17,
    favorite: true,
  },
  {
    id: "r4",
    title: "Halloumi Skewers",
    emoji: "🧀",
    image: halloumiImg,
    description: "Squeaky halloumi with cherry tomato and pepper, brushed with herbs.",
    category: "Vegetarian BBQ",
    difficulty: "Easy",
    prepMinutes: 20,
    servings: 4,
    labels: ["Vegetarian", "Gluten-free"],
    ingredients: ["Halloumi", "Cherry tomatoes", "Bell peppers", "Olive oil", "Oregano"],
    url: "https://www.olivemagazine.com/recipes/vegetarian/halloumi-skewers/",
    addedBy: { name: "Community", emoji: "🦩" },
    votes: 9,
  },
  {
    id: "r5",
    title: "Caprese Pasta Salad",
    emoji: "🍝",
    image: pastaImg,
    description: "Mozzarella, cherry tomato, basil, lemon oil. Travels great.",
    category: "Picnic",
    difficulty: "Easy",
    prepMinutes: 20,
    servings: 6,
    labels: ["Vegetarian"],
    ingredients: ["Fusilli", "Mozzarella", "Cherry tomatoes", "Basil", "Lemon", "Olive oil"],
    url: "https://www.loveandlemons.com/pasta-salad/",
    addedBy: { name: "Community", emoji: "🦩" },
    votes: 8,
  },
  {
    id: "r6",
    title: "Grilled BBQ Corn",
    emoji: "🌽",
    image: cornImg,
    description: "Charred corn, herb butter, a pinch of chili — sticky-finger heaven.",
    category: "Vegan BBQ",
    difficulty: "Easy",
    prepMinutes: 15,
    servings: 4,
    labels: ["Vegan", "Gluten-free"],
    ingredients: ["Corn cobs", "Butter (or vegan)", "Parsley", "Chili flakes", "Lime"],
    url: "https://cookieandkate.com/grilled-corn-on-the-cob-recipe/",
    addedBy: { name: "Community", emoji: "🦩" },
    votes: 7,
  },
  {
    id: "r7",
    title: "Homemade Lemonade",
    emoji: "🍋",
    image: lemonadeImg,
    description: "Cold-pressed lemon, mint, a touch of honey. Hydration with style.",
    category: "Cocktails",
    difficulty: "Easy",
    prepMinutes: 10,
    servings: 8,
    labels: ["Vegan", "Alcohol-free"],
    ingredients: ["Lemons", "Mint", "Honey", "Sparkling water", "Ice"],
    url: "https://www.simplyrecipes.com/recipes/perfect_lemonade/",
    addedBy: { name: "Community", emoji: "🦩" },
    votes: 12,
    favorite: true,
  },
];

export const recipeCategories: RecipeCategory[] = [
  "BBQ",
  "Vegetarian BBQ",
  "Vegan BBQ",
  "Salads",
  "Snacks",
  "Picnic",
  "Cocktails",
  "Desserts",
  "Marinades",
  "Dips",
];
