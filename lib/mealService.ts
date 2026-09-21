// Meal Service - Centralized meal data management
export interface MealData {
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
}

export interface MessMenuData {
  Monday: MealData;
  Tuesday: MealData;
  Wednesday: MealData;
  Thursday: MealData;
  Friday: MealData;
  Saturday: MealData;
  Sunday: MealData;
}

export interface MealTimings {
  breakfast: { start: number; end: number };
  lunch: { start: number; end: number };
  snacks: { start: number; end: number };
  dinner: { start: number; end: number };
}

// Meal timings in minutes from midnight (IST)
export const mealTimings: MealTimings = {
  breakfast: { start: 7 * 60, end: 9 * 60 }, // 7:00 AM - 9:00 AM
  lunch: { start: 11 * 60 + 30, end: 13 * 60 + 30 }, // 11:30 AM - 1:30 PM
  snacks: { start: 16 * 60 + 30, end: 17 * 60 + 30 }, // 4:30 PM - 5:30 PM
  dinner: { start: 19 * 60 + 30, end: 21 * 60 }, // 7:30 PM - 9:00 PM
};

// Sannasi Mess Menu Data
export const sannasiMenuData: MessMenuData = {
  Monday: {
    breakfast: ["Bread", "Butter", "Jam", "Chana Pongal", "Sambar", "Coconut Chutney", "Vada", "Tea / Coffee / Milk", "Boiled Egg", "Chappathi", "Aloo Rajma Masala"],
    lunch: ["Payasam", "Poori", "Potato Masala", "Variety Rice", "Steamed Rice", "Sambar", "Dal", "Tomato Rasam", "Kootu Vegetable", "Raw Banana Chips", "Special Fryums", "Buttermilk", "Pickle"],
    snacks: ["Pav Bhaji", "Tea / Coffee"],
    dinner: ["Multigrain Paratha / Veg Puri", "Mix Veg Kurma", "Millet Dosa", "Idly Podi", "Oil", "Special Chutney", "Steamed Rice", "Chilli Sambar", "Jeera Dal", "Rasam", "Aloo Capsicum", "Pickle", "Fryums", "Veg Salad", "Banana", "Mutton Gravy"]
  },
  Tuesday: {
    breakfast: ["Bread", "Butter", "Jam", "Idly", "Veg Kurma", "Sambar", "Coconut Chutney", "Tea / Coffee / Milk", "Masala Omelette"],
    lunch: ["Mint Sweet", "Green Chappathi", "Aloo Mutter Paneer Masala", "Bhindi Fry", "Steamed Rice", "Masala Sambar", "Rajma Dal", "Cabbage Poriyal", "Pepper Rasam", "Ladies Finger Pickle", "Butter Milk", "Fryums"],
    snacks: ["Sweet Peanut", "Black Channa Sundal", "Tea / Coffee"],
    dinner: ["Chappathi", "Mushroom Kurma", "Fried Rice / Noodles / Pasta", "Manchurian Gravy / Crispy Vegetable", "Steamed Rice", "Rasam", "Dal Fry", "Pickle", "Fryums", "Veg Salad", "Milk", "Spicy Fries", "Chicken Gravy"]
  },
  Wednesday: {
    breakfast: ["Bread", "Butter", "Jam", "Rava Pongal", "Coconut Chutney", "Poori", "Mutter Masala", "Tea / Coffee / Milk"],
    lunch: ["Chappathi", "Sevga Kasa", "Jeera Pulao", "Steamed Rice", "Mysore Dal Fry", "Kadi Pakoda", "Garlic Rasam", "Aloo Palak", "Aloo Parwal", "Yam Dahiwala", "Green Salad", "Pickle", "Fryums", "Butter Milk"],
    snacks: ["Veg Puff / Bread Bun", "Tea / Coffee"],
    dinner: ["Chappathi", "Steamed Rice", "Dal Tadka", "Chicken Masala / Chilli Chicken", "Veg / Paneer Butter Masala", "Rasam", "Pickle", "Fryums", "Veg Salad", "Milk", "Banana", "Chicken Gravy"]
  },
  Thursday: {
    breakfast: ["Bread", "Butter", "Jam", "Chappathi", "Dal Masala", "Hyderabadi Sevai", "Lemon & Vegetable Pulao", "Coconut Chutney", "Boiled Egg", "Banana", "Tea / Coffee / Milk"],
    lunch: ["Luchi", "Kashmiri Dum Aloo", "Onion Pulao", "Paruppu Dal", "Tadka", "Bhindi Tawa Fry", "Steamed Rice", "Kathirikai Sambar", "Garlic Rasam", "Beetroot Poriyal", "Pickle", "Fryums", "Butter Milk"],
    snacks: ["Pani Poori", "Tea / Coffee"],
    dinner: ["Ghee Pulao", "Rajma Palak", "Chappathi", "Raita", "Matar Mushroom", "Steamed Rice", "Chole Dal Fry", "Rasam", "Aloo Peas Masala", "Fryums", "Pickle", "Veg Salad", "Milk", "Ice Cream", "Chicken Gravy"]
  },
  Friday: {
    breakfast: ["Bread", "Butter", "Jam", "Oats Upma", "Idly Podi", "Oil", "Chilli Sambar", "Kara Chutney", "Ghee Chappathi", "Aloo Chutney", "Tea / Coffee / Milk", "Boiled Egg"],
    lunch: ["SPL Dry Jeera / Bread Halwa", "Veg Biryani", "Mix Raita", "Bhindi Masala", "Curd Rice", "Steamed Rice", "Tomato Rasam", "Aloo Gobi Masala", "Mungdal Tadka", "Pickle", "Papad", "Special Fryums"],
    snacks: ["Bun / Khara", "Vada", "Chutney", "Tea / Coffee"],
    dinner: ["Chicken Manchurian", "Chicken 65", "Tomato Dal", "Szechwan Rava Upma", "Coconut Chutney", "Rasam", "Mix Veg Poriyal", "Pickle", "Fryums", "Banana", "Veg Salad", "Milk", "Chicken Gravy"]
  },
  Saturday: {
    breakfast: ["Bread", "Butter", "Jam", "Chappathi", "Aloo Matar Masala", "Rava", "Soya Chunks", "Coconut Chutney", "Tea / Coffee / Milk", "Boiled Egg"],
    lunch: ["Poori", "White Peas Masala", "Veg Pulao", "Steamed Rice", "Dal Makhani", "Aloo Tikki", "Vathakuzhambu", "Matar", "Jeera Rasam", "Pickle", "Special Fryums", "Buttermilk"],
    snacks: ["Cupcake", "Brownie / Muffin", "Tea / Coffee"],
    dinner: ["Sweet Punjabi Paratha", "Gobi Capsicum", "French Fry", "Steamed Rice", "Mysore Dal Fry", "Veg Idly", "Idly Podi", "Oil", "Chutney", "Tiffin Sambar", "Rasam", "Pickle", "Fryums", "Veg Salad", "Milk", "Special Fruit", "Fish Curry"]
  },
  Sunday: {
    breakfast: ["Bread", "Butter", "Jam", "Oats Pongal", "Veg Upma", "Coconut Chutney", "Tea / Coffee / Milk", "Methi Curry"],
    lunch: ["Chappathi", "Chicken Chettinad", "Kerala Paratha", "Masala", "Kadhi Paneer", "Dal Dhadka", "Ghee Pulao", "Steamed Rice", "Garlic Rasam", "Poriyal", "Pickle", "Fryums", "Buttermilk", "Chicken Gravy"],
    snacks: ["Corn / Peas Chutney", "Juice", "Tea / Coffee"],
    dinner: ["Variety Stuffed Paratha", "Curd", "Steamed Rice", "Hari Moong Dal Tadka", "Drumstick Sambar", "Pongal", "Rasam", "Pickle", "Fryums", "Veg Salad", "Milk", "Ice Cream", "Chicken Gravy"]
  }
};

// M-Block Mess Menu Data
export const mBlockMenuData: MessMenuData = {
  Monday: {
    breakfast: ["Ven Pongal", "Tiffin Sambar", "Coconut Chutney", "Medu Vada", "Masala Omelette", "Whole Wheat Bread Omelette", "Whole Wheat Bread", "Butter", "Jam", "Milk", "Filter Coffee", "Plain Tea", "Banana"],
    lunch: ["Methi Chappathi", "Black Channa Masala", "Lemon Rice / Tamarind Rice", "Dal Makhani", "Steamed Rice", "Arachuvitta Sambar", "Keerai Kootu", "Lemon Rasam", "Curd", "Paruppu Podi", "Ghee", "Oil", "Frymes", "Pickle", "Buttermilk"],
    snacks: ["Samosa / Veg Roll", "Milk", "Rose Milk / Badam Milk", "Tea", "Whole Wheat Bread", "Butter", "Jam"],
    dinner: ["Bagara Pulao / Idli", "Raita / Chutney", "Chappathi", "Paneer Gravy / Baby Corn Gravy", "Steamed Rice", "Pumpkin Sambar", "Dal Rasam", "Buttermilk", "Pickle", "Green Salad", "Milk", "Andhra Chicken Curry / Fish Fry"]
  },
  Tuesday: {
    breakfast: ["Veg Sava Kothu / Vegetable Upma", "Vegetable Sambar", "Red Chilli Coconut Chutney", "Poori", "Aloo Masala", "Boiled Egg", "Whole Wheat Bread", "Butter", "Jam", "Milk", "Filter Coffee", "Plain Tea", "Seasonal Fruits"],
    lunch: ["Chappathi", "White Peas Curry", "Jeera Pulao", "Yellow Dal", "Steamed Rice", "Karakuzhambu / More Kuzhambu", "Poriyal", "Tomato Rasam", "Curd", "Paruppu Podi", "Ghee", "Oil", "Frymes", "Pickle", "Buttermilk", "Payasam"],
    snacks: ["Pani Puri / Pav Bhaji", "Milk", "Filter Coffee", "Ginger Tea", "Whole Wheat Bread", "Butter", "Jam"],
    dinner: ["Onion Uthappam", "Kara Chutney", "Millet Chappathi", "Dal Pancharathan", "Idli Podi", "Oil", "Steamed Rice", "Radish Sambar", "Lemon Rasam", "Buttermilk", "Pickle", "Green Salad", "Milk", "Egg Gravy"]
  },
  Wednesday: {
    breakfast: ["Idiyappam", "Vada Curry / Veg Stew", "Poha", "Mint Chutney", "Whole Wheat Bread", "Butter", "Jam", "Milk", "Filter Coffee", "Plain Tea", "Banana"],
    lunch: ["Beetroot Chappathi", "Rajna Masala", "Sambar Rice / Tomato Rice", "Dal Fry", "Steamed Rice", "Urulai Kara Curry", "Garlic Rasam", "Curd Rice", "Paruppu Podi", "Ghee", "Oil", "Appalam", "Pickle", "Buttermilk"],
    snacks: ["Cream Bun / Osmania Biscuits", "Milk", "Filter Coffee", "Masala Tea", "Whole Wheat Bread", "Butter", "Jam"],
    dinner: ["Kal Dosa", "Tomato Chutney", "Chappathi", "Paneer Butter Masala", "Steamed Rice", "Masala Sambar", "Pineapple Rasam", "Buttermilk", "Pickle", "Green Salad", "Milk", "Choco Bar / Ice Cream", "Chicken Curry / Chicken Biryani"]
  },
  Thursday: {
    breakfast: ["Idli", "Udipi Sambar", "Groundnut Chutney", "Medu Vada", "Corn Flakes", "Idli Podi", "Oil", "Boiled Egg", "Whole Wheat Bread", "Butter", "Jam", "Milk", "Filter Coffee", "Plain Tea", "Banana"],
    lunch: ["Chappathi", "Vegetable Sabji", "Ghee Pulao", "Tomato Dal Fry", "Steamed Rice", "Vathakuzhambu", "Vegetable Kootu", "Ginger Rasam", "Curd", "Paruppu Podi", "Ghee", "Oil", "Frymes", "Pickle", "Buttermilk", "Bondhi"],
    snacks: ["Masala Sundal", "Milk", "Filter Coffee", "Cardamom Tea", "Whole Wheat Bread", "Butter", "Jam"],
    dinner: ["Uthappam", "Vegetable Chutney", "Chole Poori", "Channa Masala", "Steamed Rice", "Kathirikai Sambar", "Tomato Rasam", "Buttermilk", "Pickle", "Green Salad", "Milk", "Choco Bar / Ice Cream", "Chettinadu Mutton Kuzhambu"]
  },
  Friday: {
    breakfast: ["Kal Dosa", "Tiffin Sambar", "Onion / Tomato Chutney", "Semiya Bath", "Idli Podi", "Oil", "Omelette", "Whole Wheat Bread", "Butter", "Jam", "Milk", "Filter Coffee", "Plain Tea", "Banana"],
    lunch: ["Chappathi", "Aloo Palak", "Peas Pulao", "Dal Tadka", "Steamed Rice", "Sambar", "Beetroot Poriyal", "Puli Rasam", "Curd", "Paruppu Podi", "Ghee", "Oil", "Appalam", "Pickle", "Buttermilk"],
    snacks: ["Muruku", "Milk", "Mint Lemon Juice", "Tea", "Whole Wheat Bread", "Butter", "Jam"],
    dinner: ["Pasta / Veg Schezwan Fried Rice", "Soup", "Chappathi", "Kadai Vegetables", "Steamed Rice", "Mix Veg Sambar", "Pepper Rasam", "Buttermilk", "Pickle", "Green Salad", "Milk", "Chicken Gravy"]
  },
  Saturday: {
    breakfast: ["Idli", "Chinna Vengaya Sambar", "Groundnut Chutney", "Aloo Paratha", "Curd", "Idli Podi", "Oil", "Boiled Egg", "Whole Wheat Bread", "Butter", "Jam", "Milk", "Filter Coffee", "Plain Tea", "Banana"],
    lunch: ["Chappathi", "Meal Maker Kuruma", "Vegetable Dum Biryani", "Raitha", "Steamed Rice", "Keerai Kootu", "Jeera Rasam", "Curd Rice", "Paruppu Podi", "Ghee", "Oil", "Frymes", "Pickle", "Buttermilk", "Gulabjamun / Badusha"],
    snacks: ["Eggless Cake / Brownie", "Milk", "Filter Coffee", "Masala Tea", "Whole Wheat Bread", "Butter", "Jam"],
    dinner: ["Kal Dosa", "Chutney", "Parotta", "Veg Salna", "Idli Podi", "Oil", "Steamed Rice", "Karaikudi Sambar", "Garlic Rasam", "Buttermilk", "Pickle", "Green Salad", "Milk", "Chicken Gravy"]
  },
  Sunday: {
    breakfast: ["Chole Bhature", "Chenna Masala", "Kal Dosa", "Coconut Chutney", "Sambar", "Idli Podi", "Oil", "Egg Kal Dosa", "Whole Wheat Bread", "Butter", "Jam", "Milk", "Filter Coffee", "Plain Tea", "Banana"],
    lunch: ["Chappathi", "Chicken Curry", "Paneer Gravy", "Steamed Rice", "Chettinad Sambar", "Beetroot Poriyal", "Dal Rasam", "Curd", "Paruppu Podi", "Ghee", "Oil", "Frymes", "Pickle", "Buttermilk", "Ice Cream"],
    snacks: ["Chana Sundal", "Milk", "Filter Coffee", "Ginger Tea", "Whole Wheat Bread", "Butter", "Jam"],
    dinner: ["Dal Kitchadi", "Chappathi", "Veg Kuruma", "Poriyal", "Steamed Rice", "Kadamba Sambar", "Rasam", "Buttermilk", "Pickle", "Green Salad", "Milk", "Chicken Gravy"]
  }
};


// Days of the week
export const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type DayOfWeek = typeof daysOfWeek[number];

// Meal types
export const mealTypes = ["breakfast", "lunch", "snacks", "dinner"] as const;
export type MealType = typeof mealTypes[number];


/**
 * Get meal data for a specific day and mess
 */
export const getMealData = (messHall: MessHall, day: DayOfWeek): MealData => {
  const menuData = getMessMenuData(messHall);
  return menuData[day];
};

/**
 * Get specific meal items for a day, mess, and meal type
 */
export const getMealItems = (messHall: MessHall, day: DayOfWeek, mealType: MealType): string[] => {
  const mealData = getMealData(messHall, day);
  return mealData[mealType];
};

/**
 * Get current day of the week
 */
export const getCurrentDay = (): DayOfWeek => {
  const days: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayIndex = new Date().getDay();
  return days[todayIndex] as DayOfWeek;
};

/**
 * Get current meal based on IST time
 */
export const getCurrentMeal = (): MealType => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const currentTime = hours * 60 + minutes; // Current time in minutes from midnight

  const { breakfast, lunch, snacks, dinner } = mealTimings;

  if (currentTime >= breakfast.start && currentTime <= breakfast.end) {
    return "breakfast";
  } else if (currentTime >= lunch.start && currentTime <= lunch.end) {
    return "lunch";
  } else if (currentTime >= snacks.start && currentTime <= snacks.end) {
    return "snacks";
  } else if (currentTime >= dinner.start && currentTime <= dinner.end) {
    return "dinner";
  } else if (currentTime < breakfast.start) {
    return "breakfast"; // Next meal is breakfast
  } else if (currentTime > breakfast.end && currentTime < lunch.start) {
    return "lunch"; // Next meal is lunch
  } else if (currentTime > lunch.end && currentTime < snacks.start) {
    return "snacks"; // Next meal is snacks
  } else {
    return "dinner"; // Next meal is dinner
  }
};

/**
 * Check if a meal is currently active based on time
 */
export const isMealActive = (mealType: MealType): boolean => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const currentTime = hours * 60 + minutes;

  const timing = mealTimings[mealType];
  return currentTime >= timing.start && currentTime <= timing.end;
};

/**
 * Format time in 12-hour format for IST
 */
export const formatTime12Hour = (date: Date): string => {
  // Convert to IST
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const seconds = istTime.getUTCSeconds();
  
  // Convert to 12-hour format
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Format with leading zeros
  const formattedHour = hour12.toString();
  const formattedMinute = minutes.toString().padStart(2, '0');
  const formattedSecond = seconds.toString().padStart(2, '0');
  
  return `${formattedHour}:${formattedMinute}:${formattedSecond} ${ampm}`;
};

// NRI Mess Menu Data
export const nriMenuData: MessMenuData = {
  Monday: {
    breakfast: [
      "One seasonal fruit", "Cornflakes with hot milk", "Toast", "Butter Jam",
      "Egg preparation", "Veg Upma", "Sambar", "Coconut Chutney", "Coffee", "Milk"
    ],
    lunch: [
      "Chapathi", "Subzi Kurchan", "Egg Masala", "Urulai Pattani Masala",
      "Steam Rice", "Brinjal Drumstick Sambar", "Rasam", "Curd", "Tamarind Rice",
      "Vadams", "Paneer Fried Rice", "Veg Ball Manchurian"
    ],
    snacks: ["Muffins or Fruit/Banana Cake", "Bread Butter Jam", "Cucumber", "Tomato Slice", "Tea", "Milk"],
    dinner: [
      "Aloo Chat", "Chapathi", "Rajma Masala", "Veg Kaliya",
      "Steam Rice", "Sambar", "Rasam", "Thanjavur Fried Rice",
      "Chicken Chettinad", "Dosa", "Kara Chutney", "Fresh Fruit"
    ]
  },
  Tuesday: {
    breakfast: [
      "One seasonal fruit", "Cornflakes with hot milk", "Toast", "Butter Jam",
      "Egg preparation", "Aloo Paratha", "Curd", "Pickle", "Coffee", "Milk"
    ],
    lunch: [
      "Poori", "Ghugni Mutter", "Dum Aloo Banarasi", "Beet Root Poriyal",
      "Morkuzhambu", "Steam Rice", "Rasam", "Singapore Noodle",
      "Chilly Garlic Cauliflower", "Curd", "Vadam"
    ],
    snacks: ["Veg Samosa", "Bread Butter Jam", "Tea", "Milk"],
    dinner: [
      "Green Salad", "Chapathi", "Paneer Mutter", "Shangai Chilly Cauliflower",
      "Dal", "Veg Pulao", "Idly", "Pudhina Chutney", "Steam Rice",
      "Sambar", "Rasam", "Ice Cream"
    ]
  },
  Wednesday: {
    breakfast: [
      "One seasonal fruit", "Cornflakes with hot milk", "Toast", "Butter Jam",
      "Egg preparation", "Set Dosa", "Vada Curry", "Sambar",
      "Coconut Chutney", "Coffee", "Milk"
    ],
    lunch: [
      "Poori", "Meloni Subzi", "Chat Pat Chole", "Sambar",
      "Cabbage Thovaran", "Tomato Rasam", "Lemon Rice", "Steam Rice", "Curd",
      "Corn Fried Rice", "Stir Fried Chilly Paneer", "South Indian Payasam or Sweet", "Vadam"
    ],
    snacks: ["Aloo Bonda with Coconut Chutney", "Bread Butter Jam", "Cucumber", "Tomato Slice", "Tea", "Milk"],
    dinner: [
      "Tossed Salad", "Chapathi", "Dum Ka Khim Mutter", "Hara Moong Dal",
      "Steam Rice", "Rasam", "Dragon Chicken", "Shangai Fried Rice", "Fresh Fruit"
    ]
  },
  Thursday: {
    breakfast: [
      "One seasonal fruit", "Cornflakes with hot milk", "Toast", "Butter Jam",
      "Egg preparation", "Ajwin Poori", "Aloo Masala", "Coffee", "Milk"
    ],
    lunch: [
      "Chapathi", "Aloo Gobi Shimla Mirchi", "Dal Maharani", "Keerai Masiyal",
      "Karakuzhambu", "Curd", "Peanut Butter Noodle", "Three King Vegetables", "Vadam"
    ],
    snacks: ["Veg Puffs", "Bread Butter Jam", "Tea", "Milk"],
    dinner: [
      "Green Salad", "Chapathi", "Egg Masala", "Dal Makhani", "Steam Rice",
      "Rasam", "Jeera Pulao", "Chilly Potato", "Idly Sambar", "Chutney", "Fresh Fruit"
    ]
  },
  Friday: {
    breakfast: [
      "One seasonal fruit", "Cornflakes with hot milk", "Toast", "Butter Jam",
      "Egg preparation", "Pongal", "Medu Vada", "Sambar", "Chutney", "Coffee", "Milk"
    ],
    lunch: [
      "Chapathi", "Kadi Pakodi", "Makmali Subzi", "Tomato Rice", "Urulai Podimas",
      "Curd", "Vadam", "Dhaba Style Fried Rice", "Chilly Raw Banana", "Rava Kasari or Spl Kasari"
    ],
    snacks: ["Masala Vada with Coconut Chutney", "Bread Butter Jam", "Cucumber", "Tomato Slice", "Tea", "Milk"],
    dinner: [
      "Kutchumber Salad", "Tava Paratha", "Murgh Rogan Josh or Butter Chicken Masala",
      "Paneer Butter Masala", "Jeera Dal", "Steam Rice", "Rasam", "Three Pepper Fried Rice",
      "Fresh Fruits", "Ice Cream"
    ]
  },
  Saturday: {
    breakfast: [
      "One seasonal fruit", "Cornflakes with hot milk", "Toast", "Butter Jam",
      "Egg preparation", "Masala Poha", "Medu Vada", "Sambar", "Coconut Chutney", "Coffee", "Milk"
    ],
    lunch: [
      "Poori", "Channa Masala", "Aloo Singh Poosthu", "Snack Gourd Poriyal",
      "South Indian Dal", "Rasam", "Steam Rice", "Curd", "Vadam",
      "Shangai Noodle", "Assorted Veg in Szechwan Sauce"
    ],
    snacks: ["South Indian Snacks", "Bread Butter Jam", "Tea", "Milk"],
    dinner: [
      "Green Salad", "Chapathi", "Thalippu Dosa", "Sambhar", "Chutney",
      "Aloo Mutter Dal Panchaarangi", "Steam Rice", "Pepper Rasam",
      "Schezwan Potato", "Mutter Pulao", "Fresh Fruits"
    ]
  },
  Sunday: {
    breakfast: [
      "One seasonal fruit", "Cornflakes with hot milk", "Toast", "Butter Jam",
      "Egg preparation", "Idly", "Medu Vada", "Sambar", "Chutney", "Coffee", "Milk"
    ],
    lunch: [
      "Chapathi", "Mix Veg Poriyal", "Steam Rice", "Avaraka Sambar",
      "Rasam", "Subzi Malai Kofta", "Subzi Saagwala", "Vadam", "Curd", "Ice Cream",
      "South Indian Fish Curry"
    ],
    snacks: ["Bread Bhaji", "Bread Butter Jam", "Tea", "Milk"],
    dinner: [
      "Tossed Salad", "Chicken Biryani", "Mushroom and Veg Biryani", "Raita",
      "Mirchi Ka Salan", "Fresh Fruit", "Steam Rice", "Rasam", "Banana"
    ]
  }
};

// Update available mess halls
export const messHalls = ["Sannasi", "M-Block", "NRI"] as const;
export type MessHall = typeof messHalls[number];

// Update getMessMenuData
export const getMessMenuData = (messHall: MessHall): MessMenuData => {
  if (messHall === "Sannasi") return sannasiMenuData;
  if (messHall === "M-Block") return mBlockMenuData;
  return nriMenuData;
};
