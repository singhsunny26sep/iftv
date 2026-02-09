

const SPOTIFY_CLIENT_ID = "4b0a08de8a62430f8240eef21d22a8a9"; 
const SPOTIFY_CLIENT_SECRET = "d62e53d403b9415abdec1c211281d7c9"; 

function btoaPolyfill(input) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	let str = String(input);
	let output = "";
	for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || (map = "=", i % 1); output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
		charCode = str.charCodeAt(i += 3 / 4);
		if (charCode > 0xFF) {
			throw new Error("btoa polyfill received a non-Latin1 string");
		}
		block = (block << 8) | charCode;
	}
	return output;
}

function toBasicAuth(clientId, clientSecret) {
	const encoder = (global && typeof global.btoa === 'function') ? global.btoa : btoaPolyfill;
	return "Basic " + encoder(`${clientId}:${clientSecret}`);
}

export async function getSpotifyToken() {
	const body = new URLSearchParams({ grant_type: 'client_credentials' }).toString();
	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: toBasicAuth(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET),
		},
		body,
	});

	if (!response.ok) {
		let message = `Failed to get token (status ${response.status})`;
		try {
			const err = await response.json();
			message = `Token error ${response.status}: ${err.error?.message || message}`;
		} catch (_) {}
		throw new Error(message);
	}

	const data = await response.json();
	if (!data.access_token) {
		throw new Error('No access_token in token response');
	}
	return data.access_token;
}

export async function fetchNewReleases(country = 'IN', limit = 10) {
	const token = await getSpotifyToken();
	const url = `https://api.spotify.com/v1/browse/new-releases?country=${encodeURIComponent(country)}&limit=${limit}`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	if (!response.ok) {
		let message = `Failed to fetch new releases (status ${response.status})`;
		try {
			const err = await response.json();
			message = err.error?.message || message;
		} catch (_) {}
		throw new Error(message);
	}
	const json = await response.json();
	const items = json?.albums?.items || [];
	return items.map(item => ({
		id: item.id,
		title: item.name,
		artist: (item.artists?.map(a => a.name) || []).join(', '),
		image: { uri: item.images?.[0]?.url },
	}));
}

export async function fetchAlbumFirstTrackPreview(albumId) {
	const token = await getSpotifyToken();
	const url = `https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}/tracks?limit=1&market=US`;
	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch album tracks (${response.status})`);
	}
	const json = await response.json();
	const track = json?.items?.[0];
	let previewUrl = track?.preview_url || '';
	let title = track?.name || '';
	let artists = (track?.artists?.map(a => a.name) || []).join(', ');
	if (!previewUrl && track?.id) {
		try {
			const tResp = await fetch(`https://api.spotify.com/v1/tracks/${encodeURIComponent(track.id)}?market=US`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (tResp.ok) {
				const tJson = await tResp.json();
				previewUrl = tJson?.preview_url || '';
				title = tJson?.name || title;
				artists = (tJson?.artists?.map(a => a.name) || []).join(', ') || artists;
			}
		} catch (_) {}
	}
	return { trackId: track?.id || '', title, previewUrl, artists };
}

export async function fetchPlayablePreviewForAlbum(albumId, probeCount = 10) {
	// Scan album tracks (paginated) to find first track with a preview_url
	const token = await getSpotifyToken();
	const pageLimit = 50; // Spotify max per page for album tracks
	let nextUrl = `https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}/tracks?limit=${pageLimit}&market=US`;

	while (nextUrl) {
		const tracksResp = await fetch(nextUrl, { headers: { Authorization: `Bearer ${token}` } });
		if (!tracksResp.ok) {
			throw new Error(`Failed to fetch album tracks (${tracksResp.status})`);
		}
		const tracksJson = await tracksResp.json();
		const items = tracksJson?.items || [];
		if (!items.length) break;

		const detailPromises = items.map(t => {
			const url = `https://api.spotify.com/v1/tracks/${encodeURIComponent(t.id)}?market=US`;
			return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
				.then(r => (r.ok ? r.json() : null))
				.catch(() => null);
		});
		const details = await Promise.all(detailPromises);
		const withPreview = details.find(d => d && d.preview_url);
		if (withPreview) {
			return {
				trackId: withPreview.id,
				title: withPreview.name,
				previewUrl: withPreview.preview_url,
				artists: (withPreview.artists?.map(a => a.name) || []).join(', '),
			};
		}

		nextUrl = tracksJson?.next || '';
	}

	// Fallback 2: Try the album's artists' top tracks (often have previews)
	try {
		const albumResp = await fetch(`https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (albumResp.ok) {
			const albumJson = await albumResp.json();
			const artistIds = (albumJson?.artists || []).map(a => a.id).filter(Boolean);
			for (const artistId of artistIds) {
				// Use a common market to improve consistency of top-tracks response
				const topResp = await fetch(`https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}/top-tracks?market=US`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!topResp.ok) continue;
				const topJson = await topResp.json();
				const topWithPreview = (topJson?.tracks || []).find(t => t?.preview_url);
				if (topWithPreview) {
					return {
						trackId: topWithPreview.id,
						title: topWithPreview.name,
						previewUrl: topWithPreview.preview_url,
						artists: (topWithPreview.artists?.map(a => a.name) || []).join(', '),
					};
				}
			}
		}
	} catch (_) {}

	// Fallback 3: Use recommendations based on the first artist as seed
	try {
		const albumResp = await fetch(`https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (albumResp.ok) {
			const albumJson = await albumResp.json();
			const seedArtist = (albumJson?.artists || [])[0]?.id;
			if (seedArtist) {
				const recResp = await fetch(`https://api.spotify.com/v1/recommendations?market=US&seed_artists=${encodeURIComponent(seedArtist)}&limit=20`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (recResp.ok) {
					const recJson = await recResp.json();
					const recWithPreview = (recJson?.tracks || []).find(t => t?.preview_url);
					if (recWithPreview) {
						return {
							trackId: recWithPreview.id,
							title: recWithPreview.name,
							previewUrl: recWithPreview.preview_url,
							artists: (recWithPreview.artists?.map(a => a.name) || []).join(', '),
						};
					}
				}
			}
		}
	} catch (_) {}

	return { trackId: '', title: '', previewUrl: '', artists: '' };
}

export async function fetchCategories() {
	 const myHeaders = new Headers();
	 myHeaders.append("Content-Type", "application/json");

	 const requestOptions = {
	   method: "GET",
	   headers: myHeaders,
	   redirect: "follow",
	 };

	 try {
	   const response = await fetch("https://v1.nocodeapi.com/samasong/spotify/IOBytVzGZWzKzVsW/browse/categories", requestOptions);
	   if (!response.ok) {
	     throw new Error(`Failed to fetch categories: ${response.status}`);
	   }
	   const result = await response.json();
	   return result.categories?.items || [];
	 } catch (error) {
	   console.log('Error fetching categories:', error);
	   throw error;
	 }
}

export async function fetchCategoryPlaylists(categoryId) {
	 const myHeaders = new Headers();
	 myHeaders.append("Content-Type", "application/json");

	 const requestOptions = {
	   method: "GET",
	   headers: myHeaders,
	   redirect: "follow",
	 };

	 const url = `https://v1.nocodeapi.com/samasong/spotify/IOBytVzGZWzKzVsW/browse/categoryPlaylist?category_id=${categoryId}`;

	 try {
	   const response = await fetch(url, requestOptions);
	   if (!response.ok) {
	     throw new Error(`Failed to fetch category playlists: ${response.status}`);
	   }
	   const result = await response.json();
	   return result.playlists?.items || [];
	 } catch (error) {
	   console.log('Error fetching category playlists:', error);
	   throw error;
	 }
}

