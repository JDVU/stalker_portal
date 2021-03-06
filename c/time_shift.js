/**
 * TV Time shifting module
 */

(function(){

    if (stb.firmware_version <= 208){
        return;
    }

    module.time_shift = {

        cur_media_item : {},
        in_process : false,

        get_link_for_channel : function(){
            _debug('time_shift.get_link_for_channel');

            this.in_process = true;

            stb.load(
                {
                    "type"   : "tv_archive",
                    "action" : "get_link_for_channel",
                    "ch_id"  : this.cur_media_item.id
                },
                function(result){
                    _debug('get_link_for_channel result', result);

                    this.in_process = false;

                    this.plt_link = result;
                    this.cur_media_item.cmd = result;
                },
                this
            )
        },

        get_cur_media_length : function(){
            _debug('time_shift.get_cur_media_length');

            var now = new Date();

            //_debug('now.getTime()', now.getTime());
            //_debug('live_date', this.cur_media_item.live_date);

            ///var live_date = new Date(this.cur_media_item.live_date);

            //_debug('live_date.getTime()', live_date.getTime());

            _debug('this.cur_media_item[wowza_dvr]', this.cur_media_item['wowza_dvr']);

            /*if (this.cur_media_item['wowza_dvr'] == 1){
                
                var cur_piece_date = new Date();
                var len = stb.GetMediaLen();
                var cur_pos_time = stb.GetPosTime();
                _debug('media_len', len);
                _debug('cur_pos_time', cur_pos_time);

                cur_piece_date.setSeconds(cur_piece_date.getSeconds() - len + cur_pos_time);
                
            }else{*/
                var cur_piece_date = new Date(this.cur_piece_date);
            /*}*/

            _debug('this.cur_piece_date', this.cur_piece_date);
            _debug('typeof(this.cur_piece_date)', typeof(this.cur_piece_date));
            _debug('cur_piece_date', cur_piece_date);
            _debug('typeof(cur_piece_date)', typeof(cur_piece_date));
            _debug('cur_piece_date.getTime()', cur_piece_date.getTime());

            var live_date = cur_piece_date.getYear() + '-' + cur_piece_date.getMonth() + '-' + cur_piece_date.getDate();
            
            var now_date  = now.getYear() + '-' + now.getMonth() + '-' + now.getDate();

            _debug('live_date', live_date);
            _debug('now_date', now_date);

            _debug('now', now);

            if (live_date == now_date){
                var media_len = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
                if (media_len > 5){
                    media_len = media_len - 5;
                }
            }else{
                media_len = 86400;
            }

            _debug('media_len', media_len);

            return media_len
        },

        get_pos_time : function(){
            _debug('time_shift.get_pos_time');

            _debug('stb.player.cur_media_item.cmd', stb.player.cur_media_item.cmd);

            if (/([^\/]*)\.mp[g,4]/.exec(stb.player.cur_media_item.cmd)){

                _debug('stb.player.play_initiated', stb.player.play_initiated);

                if (stb.player.play_initiated){
                    var position_part = /position:(\d*)/.exec(stb.player.cur_media_item.cmd);

                    if (position_part){
                        var current_pos_time = parseInt(position_part[1], 10);
                    }else{
                        current_pos_time = 0;
                    }

                    _debug('current_pos_time 1', current_pos_time);

                }else{
                    current_pos_time = stb.GetPosTime();
                    _debug('current_pos_time 2', current_pos_time);
                }

            /*}else if (this.cur_media_item['wowza_dvr'] == 1){
                
                var cur_time = new Date();
                var media_len = stb.GetMediaLen();
                var cur_pos_time = stb.GetPosTime();
                _debug('media_len', media_len);
                _debug('cur_pos_time', cur_pos_time);

                cur_time.setSeconds(cur_time.getSeconds() - media_len + cur_pos_time);

                pos_time = cur_time.getHours() * 3600 + cur_time.getMinutes() * 60 + cur_time.getSeconds();

                _debug('pos_time', pos_time);

                return pos_time;*/
                
            }else{
                var now = new Date();
                current_pos_time = now.getMinutes() * 60 + now.getSeconds();
                _debug('current_pos_time 3', current_pos_time);
            }

            //var current_pos_time = stb.GetPosTime();

            _debug('current_pos_time', current_pos_time);

            var cur_file_date = this._get_file_date_by_url(this.cur_media_item.cmd);

            _debug('cur_file_date', cur_file_date);

            var pos_time = cur_file_date.getHours() * 3600 + current_pos_time;

            _debug('pos_time', pos_time);

            return pos_time;
        },

        _get_file_date_by_url : function(url){
            _debug('time_shift._get_file_date_by_url', url);

            var date_part = /([^\/]*)\.mp[g,4]/.exec(url);

            _debug('date_part', date_part);

            if (!date_part){
                //return false;
                //return new Date(new Date().getTime() - stb.profile['timezone_diff']*1000);
                return new Date();
            }

            var file_date_str = date_part[1];
            var true_file_date = file_date_str.replace(/(\d{4})(\d{2})(\d{2})-(\d{2})/, '$2/$3/$1 $4:00:00');

            if (!true_file_date){
                return false;
            }

            _debug('true_file_date', true_file_date);

            return new Date(new Date(true_file_date).getTime() - stb.profile['timezone_diff']*1000);
        },

        set_media_item : function(cur_tv_item){
            _debug('time_shift.set_media_item', cur_tv_item);

            this.stored_media_item = cur_tv_item.clone();

            this.cur_media_item = cur_tv_item.clone();
            delete this.cur_media_item.open;
            this.cur_media_item.use_http_tmp_link = 0;
            this.cur_media_item.live_date = new Date();
            this.cur_piece_date = new Date();
            this.cur_piece_date.setHours(0);
            this.cur_piece_date.setMinutes(0);
            this.cur_piece_date.setSeconds(0);

            _debug('this.cur_piece_date.getTime()', this.cur_piece_date.getTime());

            _debug('this.cur_media_item', this.cur_media_item);
            _debug('this.cur_media_item.live_date.getTime()', this.cur_media_item.live_date.getTime());

            this.get_program(this.cur_media_item.id);
        },

        get_program : function(ch_id){
            _debug('time_shift.get_program', ch_id);

            stb.load(
                {
                    "type" : "epg",
                    "action" : "get_all_program_for_ch",
                    "ch_id" : ch_id
                },
                function(result){
                    _debug('time_shift.get_program result', result);

                    this.program = result || [];
                },
                this
            );
        },

        get_program_name_by_pos : function(pos){
            _debug('time_shift.get_program_name_by_pos', pos);

            this.program = this.program || [];

            var pos_time = new Date(this.cur_piece_date);
            pos_time.setSeconds(pos);

            var pos_timestamp = pos_time.getTime() / 1000;

            _debug('pos_timestamp', pos_timestamp);
            //_debug('this.program', this.program);

            for (var i = 0; i < this.program.length - 1; i++){

                //_debug('this.program[i].start_timestamp', this.program[i].start_timestamp);

                if (parseInt(this.program[i].start_timestamp, 10) > pos_timestamp){

                    if (this.program[i-1]){
                        _debug('this.program[i-1]', this.program[i-1]);
                        return this.program[i-1].name;
                    }
                }
            }

            return '';
        },

        update_media_item : function(url){
            _debug('time_shift.update_media_item', url);

            this.cur_media_item.cmd = url;
        },

        get_current_date : function(){
            _debug('time_shift.get_current_date');

            //var file_date = this._get_file_date_by_url(this.cur_media_item.cmd);
            if (stb.player.pause.on){
                //var file_date = this.cur_media_item.live_date;
                //var file_date = this.cur_piece_date.clone();
                var file_date = new Date(this.cur_piece_date);
                _debug('stb.player.new_pos_time', stb.player.new_pos_time);
                file_date.setSeconds(stb.player.new_pos_time + file_date.getSeconds());
            }else{
                file_date = this._get_file_date_by_url(this.cur_media_item.cmd);
            }

            var cur_date = file_date.getDate() + ' ' + get_word('month_arr')[file_date.getMonth()];

            _debug('cur_date', cur_date);

            return cur_date;
        },

        get_url_by_pos : function(pos){
            _debug('time_shift.get_url_by_pos', pos);

            //var cur_file_date = this._get_file_date_by_url(this.cur_media_item.cmd);
            //var cur_file_date = this._get_file_date_by_url(this.cur_media_item.cmd);

            var cur_file_date = new Date(this.cur_piece_date);
            //cur_file_date.setHours(0);

            cur_file_date.setSeconds(pos + cur_file_date.getSeconds());

            //var new_file_date = new Date(cur_file_date.getTime());

            var new_file_name = this.get_filename_by_date(cur_file_date);

            _debug('new_file_name', new_file_name);

            var position = pos - cur_file_date.getHours() * 3600;

            _debug('position', position);

            var url = this.cur_media_item.cmd.replace(/([^\/]*)\.mp[g,4]/, new_file_name).trim();

            _debug('url 1', url);

            if (!/position:(\d*)/.exec(url)){
                url += ' position:'+position;
            }else{
                url = url.replace(/position:(\d*)/, 'position:' + position).trim();
            }

            _debug('this.cur_media_item.cmd', this.cur_media_item.cmd);
            _debug('url 2', url);

            return url;
        },

        get_filename_by_date : function(date){
            _debug('time_shift.get_filename_by_date', date);

            _debug('date 1', date);

            date = new Date(date.getTime() + stb.profile['timezone_diff']*1000);

            _debug('date 2', date);

            _debug('stb.player.cur_tv_item[wowza_dvr]', stb.player.cur_tv_item);

            return date.getFullYear() + ''
                    + this.format_date(date.getMonth() + 1) + ''
                    + this.format_date(date.getDate()) + '-'
                    + this.format_date(date.getHours())
                    + (parseInt(stb.player.cur_tv_item['wowza_dvr'], 10) ? '.mp4' : '.mpg');
        },

        format_date : function(param){
            if (param<10){
                return '0'+param
            }
            return param
        },

        is_last_archive_day : function(){
            _debug('time_shift.is_last_archive_day');

            var today = new Date();
            var today_mark = today.getYear() + '' + today.getMonth() + '' + today.getDate();
            var cur_pos_mark = this.cur_piece_date.getYear() + '' + this.cur_piece_date.getMonth() + '' + this.cur_piece_date.getDate();

            _debug('today_mark', today_mark);
            _debug('cur_pos_mark', cur_pos_mark);

            return today_mark == cur_pos_mark;

        },

        get_next_part : function(){
            _debug('time_shift.get_next_part');

            var cur_file_date = this._get_file_date_by_url(stb.player.cur_media_item.cmd);
            var cur_file_date_ts = cur_file_date.getTime();

            _debug('cur_file_date_ts', cur_file_date_ts);

            var next_file_date = new Date(cur_file_date_ts + 60 * 60 * 1000);

            var next_file_name = this.get_filename_by_date(next_file_date);

            _debug('next_file_name', next_file_name);

            var url = stb.player.cur_media_item.cmd.replace(/([^\/]*)\.mp[g,4]/, next_file_name).replace(/position:(\d*)/, '').trim();

            this.cur_media_item.live_date = new Date();

            _debug('stb.player.cur_media_item.cmd', stb.player.cur_media_item.cmd);
            _debug('url', url);

            return url;
        },

        can_reduce_day : function(){
            _debug('time_shift.can_reduce_day');

            _debug('stb.user.tv_archive_hours', stb.user.tv_archive_hours);

            var seconds = stb.user.tv_archive_hours * 3600;

            var from_date = new Date();
            from_date.setSeconds(from_date.getSeconds() - seconds);
            
            //var from_date = new Date(this.cur_piece_date);

            _debug('this.cur_piece_date.getTime()', this.cur_piece_date.getTime());
            _debug('from_date.getTime()', from_date.getTime());

            return from_date < this.cur_piece_date;
        },

        in_archive : function(position){
            _debug('time_shift.in_archive', position);

            _debug('stb.user.tv_archive_hours', stb.user.tv_archive_hours);

            var seconds = stb.user.tv_archive_hours * 3600;

            var from_date = new Date();
            from_date.setSeconds(from_date.getSeconds() - seconds);
            from_date.setMinutes(0);
            from_date.setSeconds(0);

            //var from_date = new Date(this.cur_piece_date);

            var cur_piece_date = new Date(this.cur_piece_date);
            cur_piece_date.setSeconds(position);

            _debug('cur_piece_date.getTime()', cur_piece_date.getTime());
            _debug('from_date.getTime()', from_date.getTime());
            _debug('from_date < cur_piece_date', from_date < cur_piece_date);
            _debug('cur_piece_date <= new Date()', cur_piece_date <= new Date());
            _debug('new Date().toTime()', new Date().getTime());

            return (from_date < cur_piece_date) && (cur_piece_date <= new Date());
        },

        get_first_piece_position : function(){
            _debug('time_shift.get_first_piece_position');

            _debug('stb.user.tv_archive_hours', stb.user.tv_archive_hours);

            var seconds = stb.user.tv_archive_hours * 3600;

            var from_date = new Date();
            from_date.setSeconds(from_date.getSeconds() - seconds);

            return from_date.getHours() * 3600;
        },

        get_position_from_url : function(){
            _debug('time_shift.get_position_from_url');

            var position_part = /position:(\d*)/.exec(this.cur_media_item.cmd);

            if (position_part){
                var position = parseInt(position_part[1], 10);
            }else{
                position = 0;
            }

            _debug('position', position);

            return position;
        },

        update_position_in_url : function(position){
            _debug('time_shift.update_position_in_url', position);

            if (!/position:(\d*)/.exec(this.cur_media_item.cmd)){
                this.cur_media_item.cmd += ' position:'+position;
            }else{
                this.cur_media_item.cmd = this.cur_media_item.cmd.replace(/position:(\d*)/, 'position:' + position).trim();
            }

            return this.cur_media_item.cmd;
        }

    };


})();

loader.next();