class Tree {

    constructor(element) {
        const openedClass = 'fa-minus-square';
        const closedClass = 'fa-plus-square';

        let three = document.querySelector(element);
        three.classList.add("tree");

        let button = [].filter.call(three.querySelectorAll('li'), function (elem) {
            return elem.querySelector('i')
        });

        button.forEach(function (elem) {
            elem.classList.add('branch');
            elem.querySelector('i').addEventListener("click", function () {
                if (elem.childNodes[0].classList.contains(openedClass)) {
                    elem.childNodes[0].classList.replace(openedClass, closedClass);
                } else {
                    elem.childNodes[0].classList.replace(closedClass, openedClass);
                }

                elem.querySelector('ul').childNodes.forEach(function (li) {
                    if (li.classList.contains('display-block')) {
                        li.classList.replace("display-block", "display-none");
                    } else {
                        li.classList.replace("display-none", "display-block");
                    }

                    if (li.querySelector('ul') === null) {
                        if (li.querySelector('input').classList.contains('display-initial')) {
                            li.querySelector('input').classList.replace("display-initial", "display-none");
                        } else {
                            li.querySelector('input').classList.replace("display-none", "display-initial");
                        }
                    }
                })

                if (elem.querySelector('input').classList.contains('display-initial')) {
                    elem.querySelector('input').classList.replace("display-initial", "display-none");
                } else {
                    elem.querySelector('input').classList.replace("display-none", "display-initial");
                }
            });
        });

        let li = [].filter.call(three.querySelectorAll('li'), function (elem) {
            return elem.querySelector('ul')
        });

        li.forEach(function (elem) {
            elem.querySelector('ul').childNodes.forEach(function (li) {
                li.classList.add("display-none");
            })
        });

        let input = [].filter.call(three.querySelectorAll('li'), function (elem) {
            return elem.querySelector('input')
        });

        input.forEach(function (elem) {
            if(elem.parentNode.parentNode.tagName === 'DIV' && elem.querySelector('ul') === null) {
                elem.querySelector('input').classList.add("display-initial");
            }else{
                elem.querySelector('input').classList.add("display-none");
            }
        });
    }

}


export default Tree;