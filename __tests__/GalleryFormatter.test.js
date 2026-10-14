import { getGallery } from '../src/api/gallery';

jest.mock('../src/api/client', () => ({
  apiRequest: jest.fn(),
  setSessionExpiredHandler: jest.fn(),
}));

const { apiRequest } = require('../src/api/client');

const API_RESPONSE = {
  total: 36,
  totalPages: 2,
  page: 1,
  limit: 24,
  data: [
    {
      _id: '6acb36b9742c7133ac111185',
      mediaType: 'image',
      media: 'https://imagedelivery.net/xF5xEhZtZAhXZLYKgvT54w/f125dd01-56ca-4743-14dd-16002225a300/public',
      hlsUrl: null,
      poster: null,
      thumbnailUrl:
        'https://imagedelivery.net/xF5xEhZtZAhXZLYKgvT54w/f125dd01-56ca-4743-14dd-16002225a300/thumbnail',
      durationInSeconds: null,
    },
    {
      _id: '6acb36b9742c7133ac111184',
      title: 'A video item',
      mediaType: 'video',
      media: 'https://imagedelivery.net/xF5xEhZtZAhXZLYKgvT54w/abc/thumbs.mp4/public',
      hlsUrl: 'https://videos-cdn.iftv.cdn/hls/xyz.m3u8',
      poster: 'https://imagedelivery.net/xF5xEhZtZAhXZLYKgvT54w/abc/poster.png/public',
    },
  ],
};

describe('gallery formatter', () => {
  beforeEach(() => apiRequest.mockReset());

  it('formats image + video items with thumbnail + full url', async () => {
    apiRequest.mockResolvedValueOnce({
      success: true,
      data: API_RESPONSE,
    });

    const res = await getGallery({ page: 1, limit: 24 });
    expect(res.success).toBe(true);
    expect(res.total).toBe(36);
    expect(res.totalPages).toBe(2);
    expect(res.data).toHaveLength(2);

    const [img, vid] = res.data;

    // image: grid preview is the /thumbnail variant, full url is /public
    expect(img.mediaType).toBe('image');
    expect(img.media).toBe(
      'https://imagedelivery.net/xF5xEhZtZAhXZLYKgvT54w/f125dd01-56ca-4743-14dd-16002225a300/thumbnail',
    );
    expect(img.fullMedia).toBe(
      'https://imagedelivery.net/xF5xEhZtZAhXZLYKgvT54w/f125dd01-56ca-4743-14dd-16002225a300/public',
    );
    expect(img.hlsUrl).toBeNull();
    expect(img.duration).toBeNull();

    // video: preview uses poster, playback uses hlsUrl
    expect(vid.mediaType).toBe('video');
    expect(vid.poster).toBe(
      'https://imagedelivery.net/xF5xEhZtZAhXZLYKgvT54w/abc/poster.png/public',
    );
    expect(vid.hlsUrl).toBe('https://videos-cdn.iftv.cdn/hls/xyz.m3u8');
    expect(vid.fullMedia).toBe(
      'https://imagedelivery.net/xF5xEhZtZAhXZLYKgvT54w/abc/thumbs.mp4/public',
    );
  });

  it('returns empty list on 404 instead of throwing', async () => {
    const err = new Error('No any galleryitem found');
    err.status = 404;
    apiRequest.mockRejectedValueOnce(err);

    const res = await getGallery({ page: 1, limit: 20 });
    expect(res.success).toBe(true);
    expect(res.data).toEqual([]);
    expect(res.total).toBe(0);
  });

  it('uses default pagination when not provided', async () => {
    apiRequest.mockResolvedValueOnce({
      success: true,
      data: { data: [], total: 0, totalPages: 0, page: 1, limit: 20 },
    });
    const res = await getGallery();
    expect(res.page).toBe(1);
    expect(res.limit).toBe(20);
  });
});
