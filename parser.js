// @todo: напишите здесь код парсера


function parsePage() {

    function getCurrencyBySymbol(currencySymbol) {
        const map = new Map([
            ['$', 'USD'],
            ['€', 'EUR'],
            ['₽', 'RUB']
        ]);
        return map.get(currencySymbol);
    }

    function getCurrencyFromPrice(element) {
        return element.textContent.trim().slice(0, 1);
    }

    function getAmountFromPrice(element) {
        return element?.textContent.trim().slice(1);
    }

    function removeAllAttributes(element) {
        const cloneElement = element.cloneNode(true);
        Array.from(cloneElement.children)
            .map(el => {
                Array.from(el.attributes)
                    .forEach(attr => el.removeAttribute(attr.name));
                return el;
            });
        return cloneElement;
    }

    function fillMeta() {
        const meta = {};
        const htmlElement = document.querySelector('html');
        const headElement = htmlElement.querySelector('head');
        const titleElement = headElement.querySelector('title');
        const descriptionElement = headElement.querySelector('meta[name=description]');
        const keywordsElement = headElement.querySelector('meta[name=keywords]');
        const opengraphElement = headElement.querySelectorAll('meta[property ^= "og:"]');

        meta.title = titleElement.textContent.split('—')[0].trim();
        meta.description = descriptionElement.content;
        meta.keywords = keywordsElement.content.split(', ');
        meta.language = htmlElement.lang;
        meta.opengraph = Array.from(opengraphElement)
            .reduce((accum, el) => ({
                ...accum,
                [el.getAttribute('property').split(':')[1]]: el.content,
            }), {})

        return meta;
    }

    function fillProduct() {
        const product = {};
        const productElement = document.querySelector('.product');
        const nameElement = productElement.querySelector('.title');
        const likeElement = productElement.querySelector('.like');
        const tagsElements = productElement.querySelector('.tags').children;
        const priceElement = productElement.querySelector('.price');
        const oldPriceElement = priceElement.querySelector('span');
        const propertiesListItemsElements = productElement.querySelectorAll('.properties > li');
        const propertiesElements = Array.from(propertiesListItemsElements).map(el => el.children);
        const descriptionElement = productElement.querySelector('.description');
        const imageElements = productElement.querySelectorAll('.preview nav img');

        function getTagNameByClass(className) {
            const map = new Map([
                ['green', 'category'],
                ['blue', 'label'],
                ['red', 'discount']
            ]);
            return map.get(className);
        }

        product.id = productElement.dataset.id;
        product.name = nameElement.textContent;
        product.isLiked = likeElement.classList.contains('active');
        product.tags = Array.from(tagsElements)
            .reduce((accum, el) => {
                let key = getTagNameByClass(el.className);
                if (!accum[key]) {
                    accum[key] = []
                }
                accum[key].push(el.textContent);
                return accum;
            }, {});
        product.price = Number.parseInt(getAmountFromPrice(priceElement));
        product.oldPrice = Number.parseInt(getAmountFromPrice(oldPriceElement)) || product.price;
        product.discount = oldPriceElement ? product.oldPrice - product.price : 0;
        product.discountPercent = oldPriceElement ? `${((product.discount * 100) / product.oldPrice).toFixed(2)}%` : '0%';
        product.currency = getCurrencyBySymbol(getCurrencyFromPrice(priceElement));

        product.properties = Array.from(propertiesElements)
            .reduce((accum, [key, value]) => ({
                ...accum,
                [key.textContent]: value.textContent
            }), {});

        product.description = removeAllAttributes(descriptionElement).innerHTML.trim();
        product.images = Array.from(imageElements).map(el => ({
            preview: el.src,
            full: el.dataset.src,
            alt: el.alt
        }));

        return product;
    }

    function fillSuggested() {
        const suggestedContainerElement = document.querySelector('.suggested');
        const suggestedProducts = suggestedContainerElement.querySelectorAll('.items article');

        return Array.from(suggestedProducts).map(el => {
            const nameElement = el.querySelector('h3');
            const descriptionElement = el.querySelector('p');
            const imageElement = el.querySelector('img');
            const priceElement = el.querySelector('b');

            return {
                "name": nameElement.textContent,
                "description": descriptionElement.textContent,
                "image": imageElement.src,
                "price": getAmountFromPrice(priceElement),
                "currency": getCurrencyBySymbol(getCurrencyFromPrice(priceElement))
            }
        });
    }

    function fillReviews() {
        const reviewContainer = document.querySelector('.reviews');
        const reviewElements = reviewContainer.querySelectorAll('article');

        return Array.from(reviewElements).map(el => {
            const ratingElement = el.querySelector('.rating')
            const authorElement = el.querySelector('.author');
            const avatarElement = authorElement.querySelector('img');
            const nameElement = authorElement.querySelector('span');
            const titleElement = el.querySelector('.title');
            const descriptionElement = el.querySelector('p');
            const dateElement = el.querySelector('i');

            return {
                "rating": Array.from(ratingElement.children)
                    .filter(el => el.classList.contains('filled'))
                    .length,
                "author": {
                    "avatar": avatarElement.src,
                    "name": nameElement.textContent,
                },
                "title": titleElement.textContent,
                "description": descriptionElement.textContent,
                "date": dateElement.textContent.replaceAll('/', '.'),
            }
        });
    }

    return {
        meta: fillMeta(),
        product: fillProduct(),
        suggested: fillSuggested(),
        reviews: fillReviews()
    };
}

window.parsePage = parsePage;