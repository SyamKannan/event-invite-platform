<?php

namespace Database\Seeders;

use App\Models\Invitation;
use Illuminate\Database\Seeder;

class InvitationSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedWedding();
        $this->seedBirthday();
    }

    private function seedWedding(): void
    {
        $invitation = Invitation::query()->updateOrCreate(
            ['slug' => 'syam-and-swathi'],
            [
                'type' => 'wedding',
                'is_published' => true,
                'meta_title' => 'Syam & Swathi — Wedding Invitation',
                'meta_description' => 'With joy in our hearts, we invite you to celebrate the wedding of Syam & Swathi.',
                'theme' => null,
            ],
        );

        $invitation->detail()->updateOrCreate([], [
            'event_date' => '2026-06-14 16:00:00',
            'display_date' => 'Saturday, 14th June 2026',
            'display_time' => '4:00 PM onwards',
            'display_location' => 'Thrissur, Kerala',
            'hero_image' => 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80',
            'hero_overline' => 'Together with our families',
            'hero_tagline' => 'request the honour of your presence',
            'envelope_overline' => 'You are invited to celebrate',
            'envelope_cta' => 'Open Invitation',
            'envelope_animation' => 'swing-doors',
            'music_enabled' => true,
            'music_src' => '/audio/ambient.mp3',
            'contact_phone_primary' => '+91 98000 00000',
            'contact_phone_secondary' => '+91 98111 11111',
            'contact_email' => 'hello@example.com',
            'contact_instagram' => '@aiman.mahroof.wedding',
            'floating_decor_enabled' => true,
            'floating_decor_count' => 14,
            'connector' => '&',
        ]);

        $invitation->people()->delete();
        $invitation->people()->createMany([
            ['role' => 'bride', 'first_name' => 'Syam', 'parents_text' => 'Daughter of Mr. Sivadas & Mrs. Latha'],
            ['role' => 'groom', 'first_name' => 'Swathi', 'parents_text' => 'Son of Mr. Abdul Rahman & Mrs. Fathima'],
        ]);

        $invitation->milestones()->delete();
        $invitation->milestones()->createMany([
            [
                'x' => 22, 'y' => 72, 'sort_order' => 1,
                'date_label' => 'Spring 2022',
                'title' => 'How we met',
                'description' => 'Two strangers, a shared train ride, and a conversation that lasted longer than either expected.',
                'image' => 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80',
            ],
            [
                'x' => 50, 'y' => 24, 'sort_order' => 2,
                'date_label' => 'Autumn 2023',
                'title' => 'First trip together',
                'description' => 'A weekend escape to Munnar — misty hills, endless tea, and the quiet certainty that this was something rare.',
                'image' => 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80',
            ],
            [
                'x' => 78, 'y' => 72, 'sort_order' => 3,
                'date_label' => 'Winter 2024',
                'title' => 'The proposal',
                'description' => 'On a candlelit terrace under the stars, a question was asked — and joyfully answered.',
                'image' => 'https://images.unsplash.com/photo-1525772764200-be829a350797?auto=format&fit=crop&w=900&q=80',
            ],
        ]);

        $invitation->scheduleEvents()->delete();
        $invitation->scheduleEvents()->createMany([
            [
                'team' => 'groom', 'sort_order' => 1,
                'title' => 'Nikkah',
                'event_date' => '2026-06-14',
                'event_time' => '4:00 PM',
                'venue' => 'Grand Hyatt, Bolgatty',
                'address' => 'Bolgatty Island, Mulavukad, Kochi 682504',
                'map_url' => 'https://maps.google.com/?q=Grand+Hyatt+Kochi',
                'dresscode' => 'Traditional / Formal',
            ],
            [
                'team' => 'groom', 'sort_order' => 2,
                'title' => 'Reception',
                'event_date' => '2026-06-14',
                'event_time' => '7:30 PM',
                'venue' => 'Le Méridien Convention Centre',
                'address' => 'Maradu, Kochi 682304',
                'map_url' => 'https://maps.google.com/?q=Le+Meridien+Kochi',
                'dresscode' => 'Black tie optional',
            ],
            [
                'team' => 'bride', 'sort_order' => 3,
                'title' => 'Walima',
                'event_date' => '2026-06-15',
                'event_time' => '12:30 PM',
                'venue' => 'The Leela',
                'address' => 'Maradu, Kochi 682040',
                'map_url' => 'https://maps.google.com/?q=The+Leela+Kochi',
                'dresscode' => 'Festive',
            ],
            [
                'team' => 'bride', 'sort_order' => 4,
                'title' => 'Mehndi',
                'event_date' => '2026-06-13',
                'event_time' => '5:00 PM',
                'venue' => "Bride's Residence",
                'address' => 'Panampilly Nagar, Kochi 682036',
                'map_url' => 'https://maps.google.com/?q=Panampilly+Nagar+Kochi',
                'dresscode' => 'Pastel',
            ],
        ]);

        $invitation->galleryImages()->delete();
        $invitation->galleryImages()->createMany([
            ['sort_order' => 1, 'span' => 'tall', 'alt' => 'Couple under fairy lights', 'image' => 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80'],
            ['sort_order' => 2, 'alt' => 'Bride holding bouquet', 'image' => 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80'],
            ['sort_order' => 3, 'alt' => 'Wedding rings on roses', 'image' => 'https://images.unsplash.com/photo-1525772764200-be829a350797?auto=format&fit=crop&w=900&q=80'],
            ['sort_order' => 4, 'span' => 'wide', 'alt' => 'Couple holding hands', 'image' => 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80'],
            ['sort_order' => 5, 'alt' => 'Decorated venue', 'image' => 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=900&q=80'],
            ['sort_order' => 6, 'alt' => 'Floral arrangement', 'image' => 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&w=900&q=80'],
            ['sort_order' => 7, 'span' => 'tall', 'alt' => 'Sparkler send-off', 'image' => 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=900&q=80'],
            ['sort_order' => 8, 'alt' => 'Couple at golden hour', 'image' => 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80'],
        ]);
    }

    private function seedBirthday(): void
    {
        $invitation = Invitation::query()->updateOrCreate(
            ['slug' => 'priyas-30th'],
            [
                'type' => 'birthday',
                'is_published' => true,
                'meta_title' => "Priya's 30th Birthday",
                'meta_description' => 'Join us to celebrate Priya turning 30!',
                'theme' => null,
            ],
        );

        $invitation->detail()->updateOrCreate([], [
            'event_date' => '2026-11-08 18:00:00',
            'display_date' => 'Sunday, 8th November 2026',
            'display_time' => '6:00 PM onwards',
            'display_location' => 'Bengaluru, Karnataka',
            'hero_image' => 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=2000&q=80',
            'hero_overline' => 'Let\'s celebrate together',
            'hero_tagline' => 'a night of cake, music, and memories',
            'envelope_overline' => 'You are invited to a birthday bash',
            'envelope_cta' => 'Open Invitation',
            'envelope_animation' => 'confetti-pop',
            'music_enabled' => false,
            'contact_phone_primary' => '+91 90000 00000',
            'contact_email' => 'hello@example.com',
            'floating_decor_enabled' => true,
            'floating_decor_count' => 14,
            'celebrant_age' => 30,
            'celebrant_turning_text' => 'Turning 30',
        ]);

        $invitation->people()->delete();
        $invitation->people()->create([
            'role' => 'celebrant',
            'first_name' => 'Priya',
        ]);

        $invitation->scheduleEvents()->delete();
        $invitation->scheduleEvents()->create([
            'sort_order' => 1,
            'title' => 'The Party',
            'event_date' => '2026-11-08',
            'event_time' => '6:00 PM',
            'venue' => 'The Terrace Lounge',
            'address' => 'Indiranagar, Bengaluru 560038',
            'map_url' => 'https://maps.google.com/?q=Indiranagar+Bengaluru',
            'dresscode' => 'Smart casual',
        ]);

        $invitation->galleryImages()->delete();
        $invitation->galleryImages()->createMany([
            ['sort_order' => 1, 'span' => 'tall', 'alt' => 'Birthday celebration', 'image' => 'https://images.unsplash.com/photo-1464349153735-e828b4cc3f3a?auto=format&fit=crop&w=900&q=80'],
            ['sort_order' => 2, 'alt' => 'Balloons', 'image' => 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80'],
        ]);
    }
}
