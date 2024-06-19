const puppeteer = require('puppeteer');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

const url = 'https://restaurantguru.com/Pineapple-and-Pearls-Washington/menu';

function parseMenuString(menuString) {
    try {
        // Remove the extra characters from the beginning and end
        const jsonString = menuString
            .replace(/```json\n/, '')
            .replace(/\n```$/, '');
        
        // Parse the cleaned string into a JavaScript object
        const menuArray = JSON.parse(jsonString);
        
        return menuArray;
    } catch (error) {
        console.error('Error parsing menu string:', error);
        return [];
    }
}

async function getGPTResponse(images) {
    try {

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
            {
                role: 'system',
                'content':  "You're a data extractor for a restaurant menu"
            },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Extract the Name of Item, Price, and Description like so [{ "Name" : "Name of the item", "Price" : "Price of item", "Description" : "Description of Item" }, and so on ]`,
                  },
                  {
                    type: 'image_url',
                    image_url: {"url": images[0]},
                  },
                  {
                    type: 'image_url',
                    image_url: {"url": images[1]},
                  },
                  {
                    type: 'image_url',
                    image_url: {"url": images[2]},
                  },
                ],
              },
            ],
          });
        return response.choices[0];
    } catch (error) {
        console.error('Error getting GPT-4o response:', error);
        return null;
    }
}

function parseAndRemoveDuplicates(dishesArr) {
    // Create a map to track unique dishes by name
    let uniqueDishesMap = new Map();

    // Iterate through the dishes and add them to the map
    dishesArr.forEach(dish => {
        uniqueDishesMap.set(dish.Name, dish);
    });

    // Convert the map back to an array of unique dishes
    let uniqueDishes = Array.from(uniqueDishesMap.values());

    return uniqueDishes;
}

async function main () {
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.goto(url, { waitUntil: 'load', timeout: 0 });
    
    // const dataHrefs = await page.evaluate(() => {
    //     const elements = Array.from(document.querySelectorAll('img.photo-link.lazyload.lazyload_add_error_class'));
    //     return elements.map(el => el.getAttribute('data-href')).filter(Boolean); 
    // });
    
    // browser.close();
    // console.log(dataHrefs.length, '\n', dataHrefs);
    const dataHrefs = ['https://menu.restaurantguru.com/m1/menu-Pineapple-and-Pearls.jpg',
  'https://menu.restaurantguru.com/m1/Washington-Pineapple-and-Pearls-menu.jpg',
  'https://menu.restaurantguru.com/m1/menu-Pineapple-and-Pearls-Restaurant-1.jpg',
'https://menu.restaurantguru.com/m1/Pineapple-and-Pearls-Restaurant-menu-1.jpg',]

    // const result = await getGPTResponse(dataHrefs.slice(0,4));
    const result = parseMenuString('```json\n' +
      '[\n' +
      '  {\n' +
      '    "Name": "RAW TUNA & WATERMELON",\n' +
      '    "Price": "",\n' +
      '    "Description": "With aged ponzu (ok, if “real” ponzu is aged anyways so this is a bit redundant but pretty much no one ever asks so...there you go)."\n' +
      '  },\n' +
      '  {\n' +
      `    "Name": "EVEN IF YOU DON'T LIKE LAMB",\n` +
      '    "Price": "",\n' +
      '    "Description": "Yes, that is the name of this dish. Because, even if you don’t like lamb...you will like this. It’s some of the mildest and most delicious lamb loin that money can buy. From (the legendary) Elysian Fields Farm, with black forest cake and cherries."\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "“THREE CHEESE” RAVIOLI",\n' +
      '    "Price": "",\n' +
      '    "Description": "Pasta stuffed with a French triple cream cheese (Delice de Bourgogne). A sauce made from another French triple cream cheese (Brillat Savarin) and a cracker covered in an aged British Cheddar (Tickler), Inspired by the the unapologetically craveable snack “Cheez-its.”"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "MARCO’S GNOCCHI",\n' +
      '    "Price": "",\n' +
      '    "Description": "Only a handful of people in the world (taught by Chef Marco Canora himself) know how to make these. Think impossibly light clouds of potatoes floating in butter made from the milk of the cows that produce Parmesan cheese. And of course topped with absurd amounts of black truffles."\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "WORLD CLASS WAGYU",\n' +
      '    "Price": "",\n' +
      '    "Description": "This Wagyu is world class not just because of its quality but also because of the international company it keeps - from hearts of palm and guava (Brazil), to cornbread takoyaki (Japan meets America) to crispy collard greens (Southern) and a guanciale infused sauce (Italy). It’s a trip around the world with some (fancy) international friends."\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "EASTERN SHORE CRAB “FEAST”",\n' +
      '    "Price": "",\n' +
      '    "Description": "Ok so it’s not exactly a Maryland crab “feast” but it’s got all the flavors of one. Crab, potatoes, old bay. We just classed it up a touch with a variety of luxurious shellfish and our version of “mumbo sauce.”"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "COFFEE - PARMESAN RISOTTO",\n' +
      '    "Price": "",\n' +
      '    "Description": "Order it. The person sitting across from you will be jealous. Trust us."\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "PIERRE MONCUIT",\n' +
      '    "Price": "42",\n' +
      '    "Description": "hugues de coulmet, blanc de blancs, mesnil sur oger"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "GUY LARMANDIER",\n' +
      '    "Price": "37",\n' +
      '    "Description": "vertus 1er cru, brut, rose"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "VILMART & CIE",\n' +
      '    "Price": "80",\n' +
      `    "Description": "grand cellier d'or, 1er cru 2017"\n` +
      '  },\n' +
      '  {\n' +
      '    "Name": "I CUSTODI",\n' +
      '    "Price": "24",\n' +
      '    "Description": "edes, carricante, etna, sicily, italy 2021"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "J. DE VILLEBOIS",\n' +
      '    "Price": "22",\n' +
      '    "Description": "sauvignon blanc, pouilly-fume, france 2023"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "ALZINGER",\n' +
      '    "Price": "20",\n' +
      '    "Description": "krielsing (dry), durnstein federspiel, wachau, austria 2021"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "THIERRY HAMELIN",\n' +
      '    "Price": "30",\n' +
      '    "Description": "beauroy 1er cru, chablis, france 2019"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "WALTER SCOTT",\n' +
      '    "Price": "25",\n' +
      '    "Description": "bois mois, willamette valley oregon 2020"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "ANTONELLI",\n' +
      '    "Price": "19",\n' +
      '    "Description": "sangiovese, trebbiano, umbria, italy 2019"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "CLOS CIBONNE",\n' +
      '    "Price": "20",\n' +
      '    "Description": "tibouren rose, cru classe, provence 2021"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "LARKMEAD",\n' +
      '    "Price": "360",\n' +
      '    "Description": "napa valley, CA 2019"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "CHAPPELLET",\n' +
      '    "Price": "235",\n' +
      '    "Description": "napa valley, CA 2019"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "CORISON",\n' +
      '    "Price": "285",\n' +
      '    "Description": "st. helena, CA 2018"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "CORISON",\n' +
      '    "Price": "600",\n' +
      '    "Description": "st. helena, CA 1991"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "THE CRANE ASSEMBLY",\n' +
      '    "Price": "525",\n' +
      '    "Description": "g.b. crane vineyard, st. helena, CA 2012"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "PARADIGM",\n' +
      '    "Price": "165",\n' +
      '    "Description": "cabernet franc, oakville, CA 2018"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "DUNN",\n' +
      '    "Price": "325",\n' +
      '    "Description": "napa valley, CA 2018"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "CAIN FIVE",\n' +
      '    "Price": "400",\n' +
      '    "Description": "spring mountain, CA 2009"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "PETER MICHAEL",\n' +
      '    "Price": "670",\n' +
      '    "Description": "les pavots, knights valley, CA 2019"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "RDV VINEYARDS",\n' +
      '    "Price": "420",\n' +
      '    "Description": "lost mountain, VA 2017"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "WOODWARD CANYON",\n' +
      '    "Price": "200",\n' +
      '    "Description": "artist series, WA 1998"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "FORCE MAJEURE",\n' +
      '    "Price": "350",\n' +
      '    "Description": "red mountain, WA 2017"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "SEA SMOKE",\n' +
      '    "Price": "265",\n' +
      '    "Description": "ten, sta rita hills, CA 2020 hills"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "WALTER SCOTT",\n' +
      '    "Price": "130",\n' +
      '    "Description": "la combe verte, pinot noir, willamette valley, OR 2021"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "LITTORAI",\n' +
      '    "Price": "200",\n' +
      '    "Description": "les larmes, anderson valley CA 2021"\n' +
      '  },\n' +
      '  {\n' +
      '    "Name": "KOSTA BROWNE",\n' +
      '    "Price": "300",\n' +
      '    "Description": "anderson valley, CA 2020"\n' +
      '  }\n' +
      ']\n' +
    '```')

    const finalRes = parseAndRemoveDuplicates(result);
    console.log(result.length);
}

main();
