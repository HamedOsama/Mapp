const popup = document.querySelector('.popup');
const textAnn = document.getElementById('text');
const status = document.getElementById('annStatus');
const btnOkay = document.querySelector('.btn-okay');
let icon = document.querySelector('.icon');
const success = '<i class="fa fa-check"></i>';
const failed = '<i class="fa-solid fa-xmark"></i>';
let color = getComputedStyle(document.documentElement).getPropertyValue(
    '--pop'
);

btnOkay.addEventListener('click', () => {
    popup.classList.remove('active');
});
