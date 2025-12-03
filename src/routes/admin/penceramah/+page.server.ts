import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = createClient(cookies);

	const { data: lecturers, error } = await supabase
		.from('lecturers')
		.select('*')
		.order('sort_order', { ascending: true })
		.order('nama', { ascending: true });

	if (error) {
		console.error('Error fetching lecturers:', error);
	}

	return {
		lecturers: lecturers || []
	};
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const formData = await request.formData();
		const nama = formData.get('nama') as string;
		const keterangan = formData.get('keterangan') as string;
		const sort_order = parseInt(formData.get('sort_order') as string) || 0;
		const gambar = formData.get('gambar') as File | null;

		if (!nama || nama.trim() === '') {
			return fail(400, { error: 'Nama penceramah diperlukan' });
		}

		const supabase = createClient(cookies);
		let gambar_url: string | null = null;

		// Upload image if provided
		if (gambar && gambar.size > 0) {
			const fileExt = gambar.name.split('.').pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
			
			const { error: uploadError } = await supabase.storage
				.from('lecturer-photos')
				.upload(fileName, gambar, {
					contentType: gambar.type
				});

			if (uploadError) {
				console.error('Error uploading image:', uploadError);
				return fail(500, { error: 'Ralat semasa memuat naik gambar' });
			}

			const { data: urlData } = supabase.storage
				.from('lecturer-photos')
				.getPublicUrl(fileName);
			
			gambar_url = urlData.publicUrl;
		}

		const { error } = await supabase
			.from('lecturers')
			.insert({
				nama: nama.trim(),
				gambar_url,
				keterangan: keterangan?.trim() || null,
				sort_order
			});

		if (error) {
			console.error('Error creating lecturer:', error);
			return fail(500, { error: 'Ralat semasa menambah penceramah' });
		}

		return { success: true };
	},

	update: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const nama = formData.get('nama') as string;
		const keterangan = formData.get('keterangan') as string;
		const sort_order = parseInt(formData.get('sort_order') as string) || 0;
		const gambar = formData.get('gambar') as File | null;

		if (!id || !nama || nama.trim() === '') {
			return fail(400, { error: 'ID dan nama penceramah diperlukan' });
		}

		const supabase = createClient(cookies);
		
		const updateData: { nama: string; keterangan: string | null; sort_order: number; gambar_url?: string } = {
			nama: nama.trim(),
			keterangan: keterangan?.trim() || null,
			sort_order
		};

		// Upload new image if provided
		if (gambar && gambar.size > 0) {
			// Get existing photo to delete
			const { data: existingLecturer } = await supabase
				.from('lecturers')
				.select('gambar_url')
				.eq('id', id)
				.single();

			// Delete old photo if exists
			if (existingLecturer?.gambar_url) {
				const oldFileName = existingLecturer.gambar_url.split('/').pop();
				if (oldFileName) {
					await supabase.storage.from('lecturer-photos').remove([oldFileName]);
				}
			}

			// Upload new photo
			const fileExt = gambar.name.split('.').pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
			
			const { error: uploadError } = await supabase.storage
				.from('lecturer-photos')
				.upload(fileName, gambar, {
					contentType: gambar.type
				});

			if (uploadError) {
				console.error('Error uploading image:', uploadError);
				return fail(500, { error: 'Ralat semasa memuat naik gambar' });
			}

			const { data: urlData } = supabase.storage
				.from('lecturer-photos')
				.getPublicUrl(fileName);
			
			updateData.gambar_url = urlData.publicUrl;
		}

		const { error } = await supabase
			.from('lecturers')
			.update(updateData)
			.eq('id', id);

		if (error) {
			console.error('Error updating lecturer:', error);
			return fail(500, { error: 'Ralat semasa mengemaskini penceramah' });
		}

		return { success: true };
	},

	delete: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID penceramah diperlukan' });
		}

		const supabase = createClient(cookies);

		// Delete associated photo from storage if exists
		const { data: lecturer } = await supabase
			.from('lecturers')
			.select('gambar_url')
			.eq('id', id)
			.single();

		if (lecturer?.gambar_url) {
			const fileName = lecturer.gambar_url.split('/').pop();
			if (fileName) {
				await supabase.storage.from('lecturer-photos').remove([fileName]);
			}
		}

		const { error } = await supabase
			.from('lecturers')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Error deleting lecturer:', error);
			return fail(500, { error: 'Ralat semasa memadam penceramah' });
		}

		return { success: true };
	}
};
