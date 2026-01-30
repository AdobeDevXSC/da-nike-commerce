export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      let isMultiCol = false;
      const children = [...col.children];

      children.forEach((child) => {
        const hasImg = child.querySelector('img');
        // Clean slate (optional but recommended)
        col.classList.remove(
          'columns-img-col',
          'columns-reg-col',
          'columns-multi-col',
        );

        if (hasImg && children.length > 1) {
          col.classList.add('columns-multi-col');
          isMultiCol = true;
        } else if (hasImg) {
          col.classList.add('columns-img-col');
        } else {
          col.classList.add('columns-reg-col');
        }
      });

      if (isMultiCol) {
        col.classList.remove('columns-img-col', 'columns-reg-col');
        col.classList.add('columns-multi-col');

        const div = document.createElement('div');
        div.className = 'content-wrapper';

        children.forEach((child) => {
          // console.log("child: ", child);
          if (!child.querySelector('img')) {
            div.appendChild(child);
          }
        });
        col.appendChild(div);
      }
    });
  });
}
