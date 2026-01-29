export default async function decorate(block) {
  console.log("hero block : ", block);

  const img = block.querySelector('img');
  if (img) {
    img.parentElement.parentElement.parentElement.classList.add('image-container');
  }
}