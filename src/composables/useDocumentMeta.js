import { onMounted, onBeforeUnmount } from 'vue';

/**
 * Manages document meta tags + title for current view.
 * On mount: sets title + adds meta tags (description, og:*, twitter:*).
 * On unmount: restores prev title + removes added meta tags.
 *
 * @param {Object} meta
 * @param {string} meta.title - Document title
 * @param {string} meta.description - Page description
 * @param {string} [meta.ogImage] - Absolute URL or imported asset path for og:image
 * @param {string} [meta.ogTitle] - og:title (defaults to meta.title)
 * @param {string} [meta.twitterCard] - 'summary' or 'summary_large_image' (default 'summary_large_image')
 */
export function useDocumentMeta(meta) {
  let prevTitle = null;
  let addedTags = [];

  function setMeta(name, content, attribute = 'name') {
    let tag = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, name);
      document.head.appendChild(tag);
      addedTags.push(tag);
    }
    tag.setAttribute('content', content);
  }

  onMounted(() => {
    prevTitle = document.title;
    document.title = meta.title;

    if (meta.description) {
      setMeta('description', meta.description);
    }

    setMeta('og:title', meta.ogTitle || meta.title, 'property');
    if (meta.description) {
      setMeta('og:description', meta.description, 'property');
    }
    if (meta.ogImage) {
      setMeta('og:image', meta.ogImage, 'property');
    }
    setMeta('og:type', 'website', 'property');

    setMeta('twitter:card', meta.twitterCard || 'summary_large_image');
    setMeta('twitter:title', meta.ogTitle || meta.title);
    if (meta.description) {
      setMeta('twitter:description', meta.description);
    }
    if (meta.ogImage) {
      setMeta('twitter:image', meta.ogImage);
    }
  });

  onBeforeUnmount(() => {
    if (prevTitle !== null) {
      document.title = prevTitle;
    }
    addedTags.forEach(tag => {
      if (tag.parentNode) tag.parentNode.removeChild(tag);
    });
    addedTags = [];
  });
}
