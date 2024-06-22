const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

const scrapeImages = async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json('URL Missing');
    }
    try {
        const browser = await puppeteer.launch({
            args: [
                '--disable-setuid-sandbox',
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
        });

        console.log("launched!");
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'load', timeout: 0 });
        console.log("trying");
        const dataHrefs = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('img.photo-link.lazyload.lazyload_add_error_class'));
            const urls = elements.map(el => el.getAttribute('data-href')).filter(Boolean);
            return Array.from(new Set(urls)); 
        });

        const restaurantName = await page.evaluate(() => {
            const titleElement = document.querySelector('.rest_title.notranslate h1 a');
            return titleElement ? titleElement.textContent.trim() : null;
        });

        await browser.close();

        res.status(200).json({ urls: dataHrefs, restaurantName });
    } catch (e) {
        console.error('Error scraping:', e.message);
        res.status(500).json({ error: 'Error scraping data', message: e.message });
    }
};


async function getGPTResponse(images) {
    console.log(images);
    const messages = [
        {
            role: 'system',
            'content':  "You're a data extractor for a restaurant menu"
        },
        {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the Name of Item, Price, and Description like so [{ "Name" : "Name of the item", "Price" : "Price of item", "Description" : "Description of Item" }, and so on ]. Don't write anything else in response.`,
              },
              
            ],
          },
    ]

    images.forEach(url => {
        messages[1].content.push({
            type: 'image_url',
            image_url: {
                url: url
            }
        });
    });
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages
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
            const getBatchGPTResponse = async (urls, previousRes) => {
                const gptResponse = await getGPTResponse(urls);
                if(gptResponse===null) return [];
                console.log('done');
                const responseArray = parseMenuString(gptResponse);
                return parseAndRemoveDuplicates(previousRes.concat(responseArray));
            };
            
            // Function to split array into chunks
            const chunkArray = (array, chunkSize) => {
                const chunks = [];
                for (let i = 0; i < array.length; i += chunkSize) {
                    chunks.push(array.slice(i, i + chunkSize));
                }
                return chunks;
            };
            // Split imageUrls into chunks of 5
            const imageUrlChunks = chunkArray(imageUrls.slice(0,25), 3);
            
            let finalResults = [];
            for (const chunk of imageUrlChunks) {
                console.log("calling");
                const result = await getBatchGPTResponse(chunk, finalResults);
                finalResults = finalResults.concat(result);
            }
            res.status(200).json({finalResults});
        }catch(e){
            res.status(500).json(e.message);
        }
        
    } catch (error) {
        console.error('Error handling resume:', error.message);
        res.status(500).send('An error occurred while processing the resume.');
    }
}

module.exports = { scrapeImages, getResults };