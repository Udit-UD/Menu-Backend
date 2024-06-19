const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

const scrapeImages = async(req, res) => {
    const { url } = req.body;
    if(!url){
        return res.status(404).json('URL Missing');
    }
    try{
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'load', timeout: 0 });
        
        const dataHrefs = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('img.photo-link.lazyload.lazyload_add_error_class'));
            return elements.map(el => el.getAttribute('data-href')).filter(Boolean); 
        });
        
        browser.close();
        res.status(200).json({urls: dataHrefs});
    }catch(e){
        console.log(e.message);
        res.status(500).json(e.message);
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
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error getting GPT-4o response:', error);
        return null;
    }
}


function parseMenuString(menuString) {
    try {
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

function parseAndRemoveDuplicates(dishesArr) {
    let uniqueDishesMap = new Map();
    dishesArr.forEach(dish => {
        uniqueDishesMap.set(dish.Name, dish);
    });

    let uniqueDishes = Array.from(uniqueDishesMap.values());

    return uniqueDishes;
}





const getResults = async (req, res) => {
    try {
        const { imageUrls } = req.body; 
        if(!imageUrls){
            return res.status(404).json('Image URLs missing');
        }
        try{
            const gptResponse = await getGPTResponse(imageUrls.slice(0, 3));
            console.log(gptResponse);
            const responseArray = parseMenuString(gptResponse);
            const finalRes = parseAndRemoveDuplicates(responseArray);
            res.status(200).json({finalRes});
        }catch(e){
            res.status(500).json(e.message);
        }
        
    } catch (error) {
        console.error('Error handling resume:', error.message);
        res.status(500).send('An error occurred while processing the resume.');
    }
}

module.exports = { scrapeImages, getResults };